import "server-only";

/**
 * Thin, lazy wrapper over the Google Gemini REST API (free tier). Mirrors the
 * lazy-config pattern in lib/cloudinary.ts: configuration is read on first use
 * and throws a clear error only then, so builds/dev never fail when the key is
 * absent. Called with native fetch — no SDK, no new dependency, no charges.
 */

interface GeminiConfig {
  apiKey: string;
  model: string;
}

/** True when a Gemini key is present — callers can fail fast with their own copy. */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Auto-fill isn't configured. Add GEMINI_API_KEY to .env.local " +
        "(free key from https://aistudio.google.com/apikey)."
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return { apiKey, model };
}

// Minimal shape of the generateContent response we actually read.
interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/** One conversation turn in Gemini's wire format ("model" = the assistant). */
export interface GeminiTurn {
  role: "user" | "model";
  text: string;
}

/** Feature-specific wording for errors the shared layer can't phrase itself. */
interface ErrorCopy {
  timeout: string;
  network: string;
  /** Prefix for a plain HTTP failure, e.g. "Spec lookup failed". */
  failLabel: string;
}

/**
 * POST a generateContent payload with a hard 30s timeout. HTTP/quota errors are
 * mapped to readable messages; network-level ones use the caller's wording so
 * each feature keeps its own voice.
 */
async function geminiRequest(
  payload: Record<string, unknown>,
  copy: ErrorCopy
): Promise<GeminiResponse> {
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(copy.timeout);
    }
    throw new Error(copy.network);
  } finally {
    clearTimeout(timeout);
  }

  const data = (await res.json().catch(() => ({}))) as GeminiResponse;

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Free-tier limit reached — try again in a moment.");
    }
    throw new Error(
      data.error?.message || `${copy.failLabel} (HTTP ${res.status}).`
    );
  }

  return data;
}

/** Join the first candidate's text parts, or "" when the response held none. */
function candidateText(data: GeminiResponse): string {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

/**
 * Call Gemini and return the model's JSON text (constrained to `responseSchema`
 * via generationConfig). Throws a readable error on HTTP/quota/blocked/timeout.
 */
export async function geminiGenerateJSON(
  systemInstruction: string,
  userPrompt: string,
  responseSchema: unknown
): Promise<string> {
  const data = await geminiRequest(
    {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    },
    {
      timeout: "The lookup timed out. Please try again.",
      network: "Couldn't reach the spec service. Check your connection.",
      failLabel: "Spec lookup failed",
    }
  );

  if (data.promptFeedback?.blockReason) {
    throw new Error("The request was blocked. Try a different car name.");
  }

  const text = candidateText(data);

  if (!text) {
    throw new Error("No usable data was returned. Enter the specs manually.");
  }

  return text;
}

/**
 * Multi-turn plain-text chat for the site assistant. Takes the (strictly
 * scoped) system instruction plus the conversation so far and returns the
 * model's reply. Same free tier, same key as the spec lookup.
 */
export async function geminiChat(
  systemInstruction: string,
  turns: GeminiTurn[]
): Promise<string> {
  const data = await geminiRequest(
    {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { temperature: 0.4 },
    },
    {
      timeout: "The assistant timed out. Please try again.",
      network: "Couldn't reach the assistant. Check your connection.",
      failLabel: "The assistant request failed",
    }
  );

  if (data.promptFeedback?.blockReason) {
    throw new Error("That message was blocked. Try rephrasing it.");
  }

  const text = candidateText(data);

  if (!text) {
    throw new Error("The assistant couldn't produce a reply. Please try again.");
  }

  return text;
}
