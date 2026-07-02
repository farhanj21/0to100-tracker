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

/**
 * POST a generateContent request and return the candidate text. Shared by the
 * JSON and grounded callers below; throws a readable error on
 * HTTP/quota/blocked/timeout.
 */
async function geminiGenerate(
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<string> {
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The lookup timed out. Please try again.");
    }
    throw new Error("Couldn't reach the spec service. Check your connection.");
  } finally {
    clearTimeout(timeout);
  }

  const data = (await res.json().catch(() => ({}))) as GeminiResponse;

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Free-tier limit reached — try again in a moment.");
    }
    throw new Error(
      data.error?.message || `Spec lookup failed (HTTP ${res.status}).`
    );
  }

  if (data.promptFeedback?.blockReason) {
    throw new Error("The request was blocked. Try a different car name.");
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("No usable data was returned. Enter the specs manually.");
  }

  return text;
}

/**
 * Call Gemini and return the model's JSON text (constrained to `responseSchema`
 * via generationConfig).
 */
export async function geminiGenerateJSON(
  systemInstruction: string,
  userPrompt: string,
  responseSchema: unknown
): Promise<string> {
  return geminiGenerate(
    {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    },
    30_000
  );
}

/**
 * Call Gemini with Google Search grounding enabled and return plain text. The
 * API rejects structured output combined with search grounding, so callers use
 * this for a research pass and then structure the notes with a second,
 * ungrounded geminiGenerateJSON call.
 */
export async function geminiGenerateGrounded(
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  return geminiGenerate(
    {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2 },
    },
    25_000
  );
}
