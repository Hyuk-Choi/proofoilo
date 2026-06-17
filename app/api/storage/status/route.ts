import { NextResponse } from "next/server";

import { getAccountStorageStatus } from "@/lib/auth/account-store";

export const runtime = "nodejs";

export async function GET() {
  const status = await getAccountStorageStatus();

  return NextResponse.json(status, {
    status: status.ok ? 200 : 503,
  });
}
