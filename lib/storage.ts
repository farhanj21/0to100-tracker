import "server-only";
import type { UploadApiResponse } from "cloudinary";
import { getCloudinary, CLOUDINARY_FOLDER } from "@/lib/cloudinary";

/**
 * Storage abstraction for uploaded media — backed by Cloudinary.
 *
 * The rest of the app only talks to `saveFile`/`saveFiles` (which return
 * `{ type, path }` where `path` is the Cloudinary secure URL) and
 * `deleteMedia`/`deleteManyMedia`. To migrate to another provider (S3, local
 * disk, …) swap the bodies here and keep the same signatures — no callers
 * change. We pass the full media descriptor to delete so the provider knows the
 * resource type (Cloudinary needs it to destroy videos vs images).
 */

export type SavedMedia = { type: "image" | "video"; path: string };

/** Upload a Buffer to Cloudinary via a stream and resolve the API response. */
function uploadBuffer(
  buffer: Buffer,
  filename: string
): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "auto", // let Cloudinary detect image vs video
        // Keep a readable prefix in the public_id while staying unique.
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/** Persist a single uploaded File to Cloudinary and return its descriptor. */
export async function saveFile(file: File): Promise<SavedMedia> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBuffer(buffer, file.name || "upload");

  if (result.resource_type !== "image" && result.resource_type !== "video") {
    // Clean up the stray asset and reject unsupported types (e.g. raw/pdf).
    await getCloudinary()
      .uploader.destroy(result.public_id, {
        resource_type: result.resource_type,
      })
      .catch(() => {});
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  return { type: result.resource_type, path: result.secure_url };
}

/** Save many files, preserving order. */
export async function saveFiles(files: File[]): Promise<SavedMedia[]> {
  return Promise.all(files.map((f) => saveFile(f)));
}

/**
 * Recover a Cloudinary public_id (including folder) from a secure URL.
 * e.g. https://res.cloudinary.com/<c>/image/upload/v123/0to100-tracker/x.jpg
 *   ->  0to100-tracker/x
 */
function publicIdFromUrl(url: string): string | null {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let rest = url.slice(idx + marker.length);
  rest = rest.replace(/^v\d+\//, ""); // strip version segment
  rest = rest.replace(/\.[^/.]+$/, ""); // strip extension
  return rest || null;
}

/**
 * Delete a stored media asset. Best-effort: a missing asset is not an error
 * (it may have already been removed).
 */
export async function deleteMedia(media: SavedMedia): Promise<void> {
  const publicId = publicIdFromUrl(media.path);
  if (!publicId) return; // not a Cloudinary URL we manage

  try {
    await getCloudinary().uploader.destroy(publicId, {
      resource_type: media.type,
      invalidate: true,
    });
  } catch (err) {
    // Log but don't throw — deleting a car shouldn't fail over orphaned media.
    console.error(`Failed to delete media ${media.path}:`, err);
  }
}

export async function deleteManyMedia(media: SavedMedia[]): Promise<void> {
  await Promise.all(media.map((m) => deleteMedia(m)));
}
