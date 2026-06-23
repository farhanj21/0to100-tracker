import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge guard for the write-only pages. It issues a real 307 redirect to /login
 * before the protected page renders, so unauthenticated users never reach the
 * add/edit forms. The signed session cookie is verified here with Web Crypto
 * (the edge runtime has no Node `crypto`), using the same HMAC-SHA256 scheme as
 * lib/auth.ts. Write APIs are independently guarded server-side via
 * requireApiAuth(), so this is UX defense-in-depth, not the only gate.
 */

const SESSION_COOKIE = "ztoh_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const macBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const expected = Array.from(new Uint8Array(macBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected !== signature) return false;

  const issuedAt = Number(payload.split(".")[1]);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > MAX_AGE_MS) return false;

  return true;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  const authed = token && secret ? await verifyToken(token, secret) : false;
  if (authed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Only run on the pages that require admin access.
export const config = {
  matcher: ["/cars/new", "/cars/:id/edit"],
};
