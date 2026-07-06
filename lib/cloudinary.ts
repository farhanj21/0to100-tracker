import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Lazily configure the Cloudinary SDK from environment variables. Configuration
 * is deferred until first use so importing this module never throws at build
 * time — only an actual upload/delete requires the credentials to be present.
 */
let configured = false;

export function getCloudinary() {
  if (!configured) {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
      throw new Error(
        "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, " +
          "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
      );
    }

    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    configured = true;
  }

  return cloudinary;
}

/** Folder under which all media is stored in the Cloudinary account. */
export const CLOUDINARY_FOLDER =
  process.env.CLOUDINARY_FOLDER || "0to100-tracker";

/**
 * Quarantine subfolder for public submission proof media. Kept inside
 * CLOUDINARY_FOLDER so the delete-safety check in lib/storage.ts still covers
 * it, but separate from admin uploads so unreviewed files never mingle with
 * the board's own assets.
 */
export const SUBMISSIONS_FOLDER = `${CLOUDINARY_FOLDER}/submissions`;
