import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  if (!existsSync(file)) continue;

  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;

    process.env[key] = valueParts
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
}

const supabaseUrl = (
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
)?.replace(/\/$/, "");
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.PROOFOLIO_SUPABASE_SERVICE_ROLE_KEY;
const table =
  process.env.PROOFOLIO_SUPABASE_ACCOUNTS_TABLE ?? "proofolio_accounts";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase 연결값이 없습니다. SUPABASE_URL과 SUPABASE_SECRET_KEY를 .env.local 또는 배포 환경변수에 추가해 주세요.",
  );
  process.exit(1);
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
};

async function readError(response) {
  try {
    return JSON.stringify(await response.json());
  } catch {
    return await response.text();
  }
}

async function assertOk(response, step) {
  if (response.ok) return;

  throw new Error(`${step} 실패 (${response.status}): ${await readError(response)}`);
}

const id = `storage-check-${randomUUID()}`;
const now = new Date().toISOString();
const row = {
  id,
  email: `${id}@proofolio.local`,
  name: "Proofolio Storage Check",
  password_salt: "storage-check",
  password_hash: "storage-check",
  workspace: {
    schemaVersion: 4,
    uploadedFiles: [],
    analyses: [],
  },
  sessions: [],
  created_at: now,
  updated_at: now,
};

try {
  const insert = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  });
  await assertOk(insert, "테스트 계정 저장");

  const read = await fetch(
    `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=id,email`,
    {
      headers,
    },
  );
  await assertOk(read, "테스트 계정 읽기");

  const rows = await read.json();
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("테스트 계정 읽기 결과가 비어 있습니다.");
  }

  const remove = await fetch(
    `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
    },
  );
  await assertOk(remove, "테스트 계정 삭제");

  console.log(
    `Supabase 웹 저장소 연결 확인 완료: ${table} 테이블에 저장/읽기/삭제가 정상 동작합니다.`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Supabase 웹 저장소 확인 중 알 수 없는 오류가 발생했습니다.",
  );
  process.exit(1);
}
