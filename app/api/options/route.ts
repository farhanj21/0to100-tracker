import { NextResponse } from "next/server";
import {
  OPTION_CATEGORIES,
  type OptionCategory,
  addOptionValue,
  renameOptionValue,
  OptionError,
} from "@/lib/options";
import { requireApiAuth } from "@/lib/auth";
import { mirrorToSheetSafe } from "@/lib/sheet-sync";

export const dynamic = "force-dynamic";
// Renames cascade to cars and change sheet labels — mirror adds up to ~8s.
export const maxDuration = 30;

function isCategory(v: unknown): v is OptionCategory {
  return typeof v === "string" && (OPTION_CATEGORIES as readonly string[]).includes(v);
}

// POST /api/options — add a value to a category. Body: { category, value }.
export async function POST(request: Request) {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!isCategory(body?.category)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }
    const values = await addOptionValue(body.category, String(body?.value ?? ""));
    return NextResponse.json({ values });
  } catch (err) {
    if (err instanceof OptionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("POST /api/options failed:", err);
    return NextResponse.json({ error: "Failed to add option" }, { status: 500 });
  }
}

// PATCH /api/options — rename a value (cascades to cars). Body: { category, oldValue, newValue }.
export async function PATCH(request: Request) {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!isCategory(body?.category)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }
    const values = await renameOptionValue(
      body.category,
      String(body?.oldValue ?? ""),
      String(body?.newValue ?? "")
    );
    // The rename cascaded to cars, so the sheet's labels are stale — remirror.
    await mirrorToSheetSafe("rename option");
    return NextResponse.json({ values });
  } catch (err) {
    if (err instanceof OptionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("PATCH /api/options failed:", err);
    return NextResponse.json({ error: "Failed to rename option" }, { status: 500 });
  }
}
