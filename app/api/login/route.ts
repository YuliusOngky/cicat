import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken, safeEqual } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "APP_PASSWORD is not configured." }, { status: 503 });
  }

  let given = "";
  try {
    const body = await req.json();
    given = typeof body?.password === "string" ? body.password : "";
  } catch {
    // fall through with an empty password
  }

  if (!safeEqual(given, expected)) {
    // Small delay slows down brute-force guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await authToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
