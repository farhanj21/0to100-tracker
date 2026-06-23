import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import { requireApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// PATCH /api/cars/:id/thumbnail — promote one media item to the front of the
// array, making it the leaderboard thumbnail (and gallery hero). Body: { path }.
export async function PATCH(request: Request, { params }: Params) {
  const denied = requireApiAuth();
  if (denied) return denied;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { path?: unknown };
    if (typeof body.path !== "string" || !body.path) {
      return NextResponse.json(
        { error: "A media `path` is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const car = await Car.findById(params.id);
    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const index = car.media.findIndex((m) => m.path === body.path);
    if (index === -1) {
      return NextResponse.json(
        { error: "That media does not belong to this car" },
        { status: 400 }
      );
    }

    if (index > 0) {
      const [chosen] = car.media.splice(index, 1);
      car.media.unshift(chosen);
      await car.save();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/cars/${params.id}/thumbnail failed:`, err);
    return NextResponse.json(
      { error: "Failed to set thumbnail" },
      { status: 500 }
    );
  }
}
