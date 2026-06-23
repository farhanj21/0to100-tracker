import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Storage abstraction for uploaded media.
 *
 * The rest of the app only talks to `saveFile` / `deleteFile`, which return and
 * accept public URL paths (e.g. "/uploads/abc.jpg"). To migrate to S3 or
 * Cloudinary later, swap the body of these two functions to upload/delete via
 * the provider SDK and return the provider URL — no callers need to change.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

export type SavedMedia = { type: "image" | "video"; path: string };

function extFor(file: File): string {
  const fromName = path.extname(file.name);
  if (fromName) return fromName.toLowerCase();
  // Fallback to a sensible extension from the MIME type.
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/ogg": ".ogv",
  };
  return map[file.type] ?? "";
}

function classify(file: File): "image" | "video" | null {
  if (IMAGE_TYPES.has(file.type)) return "image";
  if (VIDEO_TYPES.has(file.type)) return "video";
  return null;
}

/** Persist a single uploaded File and return its public path + media type. */
export async function saveFile(file: File): Promise<SavedMedia> {
  const kind = classify(file);
  if (!kind) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}${extFor(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return { type: kind, path: `${PUBLIC_PREFIX}/${filename}` };
}

/** Save many files, preserving order. */
export async function saveFiles(files: File[]): Promise<SavedMedia[]> {
  return Promise.all(files.map((f) => saveFile(f)));
}

/**
 * Delete a stored media file by its public path. Best-effort: a missing file
 * is not treated as an error (it may have already been removed).
 */
export async function deleteFile(publicPath: string): Promise<void> {
  if (!publicPath.startsWith(PUBLIC_PREFIX)) return;
  const filename = path.basename(publicPath);
  const absolute = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(absolute);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      // Log but don't throw — deleting a car shouldn't fail over orphaned media.
      console.error(`Failed to delete media ${publicPath}:`, err);
    }
  }
}

export async function deleteFiles(publicPaths: string[]): Promise<void> {
  await Promise.all(publicPaths.map((p) => deleteFile(p)));
}
