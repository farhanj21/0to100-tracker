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
 * Call Gemini and return the model's JSON text (constrained to `responseSchema`
 * via generationConfig). Throws a readable error on HTTP/quota/blocked/timeout.
 */
export async function geminiGenerateJSON(
  systemInstruction: string,
  userPrompt: string,
  responseSchema: unknown
): Promise<string> {
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
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
        },
      }),
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
