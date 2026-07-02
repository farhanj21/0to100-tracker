import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { fetchCarSpecs } from "@/lib/specs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// The grounded (web search) research pass plus the structuring call can take
// well over the 10s default.
export const maxDuration = 60;

const bodySchema = z.object({
  manufacturer: z.string().trim().min(1),
  carModel: z.string().trim().min(1),
  variant: z.string().trim().optional(),
  modelYear: z.coerce.number().int().optional(),
});

// POST /api/cars/fetch-specs — look up a car's specs (free Gemini tier) and
// return them for the admin to review. Auth-gated like the other write routes.
export async function POST(request: Request) {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Manufacturer and model are required." },
        { status: 400 }
      );
    }

    const specs = await fetchCarSpecs(parsed.data);
    return NextResponse.json({ specs });
  } catch (err) {
    console.error("POST /api/cars/fetch-specs failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch specs.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
