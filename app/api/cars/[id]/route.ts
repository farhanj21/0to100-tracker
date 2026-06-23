import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import { getCarById } from "@/lib/cars";
import { carInputSchema } from "@/lib/validation";
import { deleteFiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/cars/:id — single car with computed global position.
export async function GET(_request: Request, { params }: Params) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const car = await getCarById(params.id);
    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }
    return NextResponse.json({ car });
  } catch (err) {
    console.error(`GET /api/cars/${params.id} failed:`, err);
    return NextResponse.json({ error: "Failed to load car" }, { status: 500 });
  }
}

// PUT /api/cars/:id — replace car fields. Media files removed from the form are
// deleted from disk so we don't leave orphans behind.
export async function PUT(request: Request, { params }: Params) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
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
    const existing = await Car.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const keptPaths = new Set(parsed.data.media.map((m) => m.path));
    const removedPaths = existing.media
      .map((m) => m.path)
      .filter((p) => !keptPaths.has(p));

    existing.set(parsed.data);
    await existing.save();

    if (removedPaths.length) {
      await deleteFiles(removedPaths);
    }

    return NextResponse.json({ id: String(existing._id) });
  } catch (err) {
    console.error(`PUT /api/cars/${params.id} failed:`, err);
    return NextResponse.json({ error: "Failed to update car" }, { status: 500 });
  }
}

// DELETE /api/cars/:id — remove the car and clean up its media from disk.
export async function DELETE(_request: Request, { params }: Params) {
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await dbConnect();
    const deleted = await Car.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    await deleteFiles(deleted.media.map((m) => m.path));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/cars/${params.id} failed:`, err);
    return NextResponse.json({ error: "Failed to delete car" }, { status: 500 });
  }
}
