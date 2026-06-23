import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import { getRankedCars } from "@/lib/cars";
import { carInputSchema } from "@/lib/validation";
import { requireApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cars — full leaderboard, ranked fastest → slowest.
export async function GET() {
  try {
    const cars = await getRankedCars();
    return NextResponse.json({ cars });
  } catch (err) {
    console.error("GET /api/cars failed:", err);
    return NextResponse.json(
      { error: "Failed to load cars" },
      { status: 500 }
    );
  }
}

// POST /api/cars — create a car. Body is JSON validated by zod.
export async function POST(request: Request) {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = carInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const created = await Car.create(parsed.data);

    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/cars failed:", err);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}
