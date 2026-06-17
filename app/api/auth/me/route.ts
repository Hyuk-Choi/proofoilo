import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAccountBySessionToken,
  PROOFOLIO_SESSION_COOKIE,
} from "@/lib/auth/account-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PROOFOLIO_SESSION_COOKIE)?.value;
  const account = await getAccountBySessionToken(sessionToken);

  if (!account) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  return NextResponse.json(account);
}
