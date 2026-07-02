import { NextResponse } from "next/server";
import { z } from "zod";
import { SheetFormatError } from "@/lib/sheet-format";
import {
  applySheetValues,
  buildMirrorTable,
  verifySyncSecret,
} from "@/lib/sheet-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// New rows may each run a two-step AI spec lookup — allow well beyond the
// default 10s. (Within Vercel Hobby's 60s ceiling.)
export const maxDuration = 60;

const bodySchema = z.object({
  secret: z.string().min(1),
  // Raw getValues() output, header row included. Cells arrive as
  // string/number/bool; dates would come through as ISO strings.
  values: z.array(z.array(z.unknown())).min(1),
});

// POST /api/sheet-sync — called by the Google Sheet's Apps Script with the
// full "Sorted Table". Applies new/edited rows to the database and returns the
// canonical mirror for the script to write back (sorted, positions, Car IDs).
// Authenticated by the shared SHEET_SYNC_SECRET, not the admin cookie.
export async function POST(request: Request) {
  if (!process.env.SHEET_SYNC_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Sheet sync isn't configured (SHEET_SYNC_SECRET)." },
      { status: 503 }
    );
  }

  // Parse from text so it works whether the script posts as JSON or plain text.
  let body: unknown = null;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 }
    );
  }

  const result = bodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Expected { secret, values: [[...]] }." },
      { status: 400 }
    );
  }
  const parsed = result.data;

  if (!verifySyncSecret(parsed.secret)) {
    return NextResponse.json(
      { ok: false, error: "Invalid sync secret." },
      { status: 401 }
    );
  }

  try {
    const report = await applySheetValues(parsed.values);
    const mirror = await buildMirrorTable();
    return NextResponse.json({ ok: true, report, mirror });
  } catch (err) {
    if (err instanceof SheetFormatError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error("POST /api/sheet-sync failed:", err);
    return NextResponse.json(
      { ok: false, error: "Sync failed — check the server logs." },
      { status: 500 }
    );
  }
}
