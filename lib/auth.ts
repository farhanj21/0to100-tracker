import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Minimal admin-passcode auth. Anyone who enters the shared ADMIN_PASSCODE at
 * /login gets a signed, httpOnly session cookie that unlocks write actions
 * (add/edit/delete cars + media). Reading the leaderboard stays public.
 *
 * The session token is `admin.<issuedAt>.<hmac>`, signed with SESSION_SECRET so
 * it can't be forged. No database or user accounts are involved.
 */

export const SESSION_COOKIE = "ztoh_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

function getSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Build a fresh signed session token. Throws if SESSION_SECRET is missing. */
export function createSessionToken(): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing SESSION_SECRET");
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a token's signature and that it hasn't expired. */
export function verifySessionToken(token?: string | null): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload, secret))) return false;

  const issuedAt = Number(payload.split(".")[1]);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE * 1000) return false;

  return true;
}

/** Constant-time compare of a submitted passcode against ADMIN_PASSCODE. */
export function checkPasscode(input: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) throw new Error("Missing ADMIN_PASSCODE");
  return safeEqual(input, expected);
}

/** Whether ADMIN_PASSCODE and SESSION_SECRET are both configured. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE && process.env.SESSION_SECRET);
}

/** Read the request cookie and report whether the caller is an admin. */
export function isAuthenticated(): boolean {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * Guard for write route handlers. Returns a 401 NextResponse to return early
 * when the caller isn't authenticated, or null when they are.
 */
export function requireApiAuth(): NextResponse | null {
  if (!isAuthenticated()) {
    return NextResponse.json(
      { error: "Unauthorized — please log in." },
      { status: 401 }
    );
  }
  return null;
}
