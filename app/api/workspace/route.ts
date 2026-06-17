import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAccountBySessionToken,
  PROOFOLIO_SESSION_COOKIE,
  saveWorkspaceForSessionToken,
} from "@/lib/auth/account-store";
import type { ProofolioWorkspace } from "@/types/proofolio";

export const runtime = "nodejs";

async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(PROOFOLIO_SESSION_COOKIE)?.value;
}

export async function GET() {
  const account = await getAccountBySessionToken(await getSessionToken());

  if (!account) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  return NextResponse.json(account);
}

export async function PUT(request: Request) {
  let body: { workspace?: unknown };

  try {
    body = (await request.json()) as { workspace?: unknown };
  } catch {
    return NextResponse.json(
      { message: "저장할 워크스페이스 데이터를 읽지 못했습니다." },
      { status: 400 },
    );
  }

  if (typeof body.workspace !== "object" || body.workspace === null) {
    return NextResponse.json(
      { message: "저장할 워크스페이스 데이터가 없습니다." },
      { status: 400 },
    );
  }

  const account = await saveWorkspaceForSessionToken(
    await getSessionToken(),
    body.workspace as ProofolioWorkspace,
  );

  if (!account) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  return NextResponse.json(account);
}
