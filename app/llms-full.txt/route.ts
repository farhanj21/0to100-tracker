import { getRankedCars } from "@/lib/cars";
import { LLMS_HEADERS, buildLlmsFullTxt } from "@/lib/llms";

export const dynamic = "force-dynamic";

// GET /llms-full.txt — every car's full spec sheet in one Markdown file.
export async function GET() {
  try {
    const cars = await getRankedCars();
    return new Response(buildLlmsFullTxt(cars), { headers: LLMS_HEADERS });
  } catch (err) {
    console.error("GET /llms-full.txt failed:", err);
    return new Response("Temporarily unavailable.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" },
    });
  }
}
