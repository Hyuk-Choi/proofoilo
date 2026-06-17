import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  logoutSessionToken,
  PROOFOLIO_SESSION_COOKIE,
} from "@/lib/auth/account-store";

export const runtime = "nodejs";

function isSecureRequest(request: NextRequest) {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PROOFOLIO_SESSION_COOKIE)?.value;
  await logoutSessionToken(sessionToken);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: PROOFOLIO_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });

  return response;
}
