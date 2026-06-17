import { NextResponse, type NextRequest } from "next/server";

import {
  getSessionMaxAgeSeconds,
  loginOrCreateAccount,
  PROOFOLIO_SESSION_COOKIE,
} from "@/lib/auth/account-store";
import type { ProofolioWorkspace } from "@/types/proofolio";

export const runtime = "nodejs";

function isSecureRequest(request: NextRequest) {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
      workspace?: unknown;
    };

    const result = await loginOrCreateAccount({
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
      name: typeof body.name === "string" ? body.name : undefined,
      workspace:
        typeof body.workspace === "object" && body.workspace !== null
          ? (body.workspace as ProofolioWorkspace)
          : undefined,
    });
    const response = NextResponse.json({
      user: result.user,
      workspace: result.workspace,
    });

    response.cookies.set({
      name: PROOFOLIO_SESSION_COOKIE,
      value: result.token,
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "로그인 처리 중 문제가 발생했습니다.",
      },
      { status: 400 },
    );
  }
}
