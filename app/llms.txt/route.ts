import { getRankedCars } from "@/lib/cars";
import { LLMS_HEADERS, buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-dynamic";

// GET /llms.txt — site overview and the current rankings, for AI crawlers.
export async function GET() {
  try {
    const cars = await getRankedCars();
    return new Response(buildLlmsTxt(cars), { headers: LLMS_HEADERS });
  } catch (err) {
    console.error("GET /llms.txt failed:", err);
    return new Response("Temporarily unavailable.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" },
    });
  }
}
