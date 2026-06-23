import { NextResponse } from "next/server";
import {
  checkPasscode,
  createSessionToken,
  isAuthConfigured,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/login — body { passcode }. Sets a signed session cookie.
export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Auth is not configured. Set ADMIN_PASSCODE and SESSION_SECRET in .env.local.",
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { passcode?: unknown };
    if (typeof body.passcode !== "string" || !body.passcode) {
      return NextResponse.json(
        { error: "Passcode is required" },
        { status: 400 }
      );
    }

    if (!checkPasscode(body.passcode)) {
      return NextResponse.json(
        { error: "Incorrect passcode" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
