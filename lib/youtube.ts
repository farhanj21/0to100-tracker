/**
 * YouTube helpers (pure — safe on client and server).
 *
 * For `youtube` media items we store just the 11-character video ID in
 * `media.path`, and build embed/thumbnail URLs from it on render.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extract a YouTube video ID from a URL or a bare ID, or null if invalid. */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const v = url.searchParams.get("v");
      return v && ID_RE.test(v) ? v : null;
    }
    const m = url.pathname.match(/^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }

  return null;
}

/** Privacy-friendly embed URL for an iframe. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** Poster/thumbnail image URL for a video ID. */
export function youTubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Canonical watch URL (for links). */
export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
