import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authToken, safeEqual } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  if (!password) {
    // Fail open for local dev, fail closed in production so a missing env var never exposes the API key.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("APP_PASSWORD is not configured.", { status: 503 });
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await authToken(password))) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except the login page/endpoint and Next.js static assets.
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
