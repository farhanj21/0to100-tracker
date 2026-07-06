import { NextResponse } from "next/server";
import { saveFiles } from "@/lib/storage";
import { SUBMISSIONS_FOLDER } from "@/lib/cloudinary";
import { createRateLimiter, clientKeyFrom } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// Proof videos can be large; run on the Node.js runtime with no edge size limits.
export const runtime = "nodejs";

/**
 * Public proof-media upload for submissions. Deliberately separate from the
 * admin-only /api/upload: files land in a quarantined Cloudinary subfolder,
 * and this route enforces its own caps (count, size, mime type) because the
 * caller is untrusted.
 */

const MAX_FILES = 4;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // one proof clip
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// A full run submission needs at most a handful of uploads; a dozen an hour
// per client covers retries without letting anyone treat this as free hosting.
const limiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  perClientMax: 12,
  globalMax: 60,
});

// POST /api/submissions/upload — multipart form-data with one or more "files".
// Returns the saved media descriptors: [{ type, path }].
export async function POST(request: Request) {
  if (limiter.isRateLimited(clientKeyFrom(request))) {
    return NextResponse.json(
      { error: "Too many uploads for now — try again in a little while." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `At most ${MAX_FILES} files per submission` },
        { status: 400 }
      );
    }

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || "unknown"}` },
          { status: 400 }
        );
      }
      const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > cap) {
        return NextResponse.json(
          {
            error: `"${file.name}" is too large — keep ${
              isVideo ? "videos under 100 MB" : "images under 8 MB"
            }.`,
          },
          { status: 400 }
        );
      }
    }

    const media = await saveFiles(files, SUBMISSIONS_FOLDER);
    return NextResponse.json({ media }, { status: 201 });
  } catch (err) {
    console.error("POST /api/submissions/upload failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to upload files";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
