import { NextResponse } from "next/server";
import { saveFiles } from "@/lib/storage";
import { requireApiAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
// Media can be large; run on the Node.js runtime with no edge size limits.
export const runtime = "nodejs";

// POST /api/upload — multipart form-data with one or more "files".
// Returns the saved media descriptors: [{ type, path }].
export async function POST(request: Request) {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const media = await saveFiles(files);
    return NextResponse.json({ media }, { status: 201 });
  } catch (err) {
    console.error("POST /api/upload failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to upload files";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
