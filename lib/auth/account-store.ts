import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  createEmptyProofolioWorkspace,
  normalizeProofolioWorkspace,
} from "@/lib/storage";
import type { ProofolioWorkspace } from "@/types/proofolio";

export const PROOFOLIO_SESSION_COOKIE = "proofolio_session";

export type ProofolioAccountUser = {
  id: string;
  email: string;
  name: string;
};

type StoredSession = {
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
};

type StoredAccount = {
  id: string;
  email: string;
  name: string;
  passwordSalt: string;
  passwordHash: string;
  workspace: ProofolioWorkspace;
  sessions: StoredSession[];
  createdAt: string;
  updatedAt: string;
};

type AccountDatabase = {
  schemaVersion: 1;
  accounts: StoredAccount[];
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".proofolio-data");
const DATA_FILE = path.join(DATA_DIR, "accounts.json");
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_SUPABASE_TABLE = "proofolio_accounts";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  table: string;
};

export type AccountStorageStatus = {
  mode: "local-file" | "supabase";
  ok: boolean;
  label: string;
  message: string;
  table?: string;
  accountCount?: number;
};

type SupabaseAccountRow = {
  id: string;
  email: string;
  name: string;
  password_salt: string;
  password_hash: string;
  workspace: ProofolioWorkspace;
  sessions: StoredSession[] | null;
  created_at: string;
  updated_at: string;
};

function createEmptyDatabase(): AccountDatabase {
  return {
    schemaVersion: 1,
    accounts: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, storedHash: string) {
  const candidate = Buffer.from(getPasswordHash(password, salt), "hex");
  const stored = Buffer.from(storedHash, "hex");

  return (
    candidate.length === stored.length &&
    timingSafeEqual(candidate, stored)
  );
}

function getTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createSession() {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();

  return {
    token,
    session: {
      tokenHash: getTokenHash(token),
      createdAt: now.toISOString(),
      expiresAt,
    },
  };
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.PROOFOLIO_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
    table:
      process.env.PROOFOLIO_SUPABASE_ACCOUNTS_TABLE ??
      DEFAULT_SUPABASE_TABLE,
  };
}

function isManagedServerlessDeployment() {
  return Boolean(process.env.VERCEL || process.env.CF_PAGES || process.env.NETLIFY);
}

function getSupabaseHeaders(config: SupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function getSupabaseErrorMessage(response: Response) {
  const fallback = `Supabase 저장소 요청에 실패했습니다. (${response.status})`;

  try {
    const payload = (await response.json()) as {
      message?: string;
      details?: string;
      hint?: string;
    };

    return (
      [payload.message, payload.details, payload.hint]
        .filter(Boolean)
        .join(" ")
        .trim() || fallback
    );
  } catch {
    return fallback;
  }
}

function getPublicUser(account: StoredAccount): ProofolioAccountUser {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
  };
}

function removeExpiredSessions(account: StoredAccount, now = Date.now()) {
  account.sessions = account.sessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now,
  );
}

function applyAccountProfile(
  workspace: ProofolioWorkspace,
  account: Pick<ProofolioAccountUser, "email" | "name">,
) {
  return normalizeProofolioWorkspace({
    ...workspace,
    userProfile: {
      ...workspace.userProfile,
      name: account.name || workspace.userProfile.name,
      email: account.email,
      updatedAt: new Date().toISOString(),
    },
  });
}

function rowToAccount(row: SupabaseAccountRow): StoredAccount {
  return {
    id: row.id,
    email: normalizeEmail(row.email),
    name: row.name,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    workspace: normalizeProofolioWorkspace(row.workspace),
    sessions: Array.isArray(row.sessions) ? row.sessions : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function accountToRow(account: StoredAccount): SupabaseAccountRow {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    password_salt: account.passwordSalt,
    password_hash: account.passwordHash,
    workspace: normalizeProofolioWorkspace(account.workspace),
    sessions: account.sessions,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

async function readLocalDatabase(): Promise<AccountDatabase> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AccountDatabase>;

    if (!Array.isArray(parsed.accounts)) {
      return createEmptyDatabase();
    }

    return {
      schemaVersion: 1,
      accounts: parsed.accounts.map((account) => ({
        ...account,
        workspace: normalizeProofolioWorkspace(account.workspace),
        sessions: Array.isArray(account.sessions) ? account.sessions : [],
      })) as StoredAccount[],
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return createEmptyDatabase();
  }
}

async function writeLocalDatabase(database: AccountDatabase) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    `${JSON.stringify(
      {
        ...database,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function readSupabaseDatabase(
  config: SupabaseConfig,
): Promise<AccountDatabase> {
  const select = [
    "id",
    "email",
    "name",
    "password_salt",
    "password_hash",
    "workspace",
    "sessions",
    "created_at",
    "updated_at",
  ].join(",");
  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?select=${select}&order=created_at.asc`,
    {
      headers: getSupabaseHeaders(config),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const message = await getSupabaseErrorMessage(response);
    throw new Error(
      `Supabase 계정 저장소를 읽지 못했습니다. ${message} 배포 가이드의 테이블 생성 SQL을 확인해 주세요.`,
    );
  }

  const rows = (await response.json()) as SupabaseAccountRow[];

  return {
    schemaVersion: 1,
    accounts: rows.map(rowToAccount),
    updatedAt: new Date().toISOString(),
  };
}

async function writeSupabaseDatabase(
  config: SupabaseConfig,
  database: AccountDatabase,
) {
  if (!database.accounts.length) return;

  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(config),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(database.accounts.map(accountToRow)),
    },
  );

  if (!response.ok) {
    const message = await getSupabaseErrorMessage(response);
    throw new Error(
      `Supabase 계정 저장소에 저장하지 못했습니다. ${message} 배포 환경변수와 테이블 권한을 확인해 주세요.`,
    );
  }
}

async function readDatabase(): Promise<AccountDatabase> {
  const supabaseConfig = getSupabaseConfig();

  if (supabaseConfig) {
    return readSupabaseDatabase(supabaseConfig);
  }

  return readLocalDatabase();
}

async function writeDatabase(database: AccountDatabase) {
  const supabaseConfig = getSupabaseConfig();

  if (supabaseConfig) {
    await writeSupabaseDatabase(supabaseConfig, database);
    return;
  }

  if (isManagedServerlessDeployment()) {
    throw new Error(
      "웹 배포 환경에서는 로컬 파일 저장소에 진행 상황을 영구 저장할 수 없습니다. SUPABASE_URL과 SUPABASE_SECRET_KEY를 연결해 주세요.",
    );
  }

  await writeLocalDatabase(database);
}

export async function getAccountStorageStatus(): Promise<AccountStorageStatus> {
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    if (isManagedServerlessDeployment()) {
      return {
        mode: "local-file",
        ok: false,
        label: "웹 저장소 미연결",
        message:
          "Vercel/Cloudflare Pages/Netlify 같은 웹 배포에서는 Supabase 환경변수를 연결해야 계정별 진행 상황이 유지됩니다.",
      };
    }

    const database = await readLocalDatabase();

    return {
      mode: "local-file",
      ok: true,
      label: "로컬 파일 저장소",
      message:
        "현재 서버의 .proofolio-data/accounts.json에 계정 워크스페이스를 저장합니다. 이 방식은 로컬 실행과 Cloudflare 임시 터널에 적합합니다.",
      accountCount: database.accounts.length,
    };
  }

  try {
    const database = await readSupabaseDatabase(supabaseConfig);

    return {
      mode: "supabase",
      ok: true,
      label: "Supabase 웹 저장소",
      message:
        "계정별 업로드 목록, 분석 리포트, 생성 결과물과 진행 상황이 Supabase에 저장됩니다.",
      table: supabaseConfig.table,
      accountCount: database.accounts.length,
    };
  } catch (error) {
    return {
      mode: "supabase",
      ok: false,
      label: "Supabase 연결 오류",
      message:
        error instanceof Error
          ? error.message
          : "Supabase 웹 저장소 상태를 확인하지 못했습니다.",
      table: supabaseConfig.table,
    };
  }
}

export function getSessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export async function loginOrCreateAccount(input: {
  email: string;
  password: string;
  name?: string;
  workspace?: ProofolioWorkspace;
}) {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const name = input.name?.trim() || email.split("@")[0] || "Proofolio User";

  if (!email.includes("@")) {
    throw new Error("유효한 이메일 주소를 입력해 주세요.");
  }

  if (password.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }

  const database = await readDatabase();
  let account = database.accounts.find((item) => item.email === email);

  if (account) {
    if (!verifyPassword(password, account.passwordSalt, account.passwordHash)) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    removeExpiredSessions(account);
  } else {
    const salt = randomBytes(16).toString("hex");
    const workspace = applyAccountProfile(
      normalizeProofolioWorkspace(
        input.workspace ?? createEmptyProofolioWorkspace(),
      ),
      { email, name },
    );
    const now = new Date().toISOString();

    account = {
      id: `account-${randomBytes(10).toString("hex")}`,
      email,
      name,
      passwordSalt: salt,
      passwordHash: getPasswordHash(password, salt),
      workspace,
      sessions: [],
      createdAt: now,
      updatedAt: now,
    };
    database.accounts.push(account);
  }

  const { token, session } = createSession();
  account.sessions.push(session);
  account.updatedAt = new Date().toISOString();

  await writeDatabase(database);

  return {
    token,
    user: getPublicUser(account),
    workspace: account.workspace,
  };
}

export async function getAccountBySessionToken(token: string | undefined) {
  if (!token) return null;

  const database = await readDatabase();
  const tokenHash = getTokenHash(token);
  const now = Date.now();
  const account = database.accounts.find((item) =>
    item.sessions.some(
      (session) =>
        session.tokenHash === tokenHash &&
        new Date(session.expiresAt).getTime() > now,
    ),
  );

  if (!account) return null;

  return {
    user: getPublicUser(account),
    workspace: account.workspace,
  };
}

export async function saveWorkspaceForSessionToken(
  token: string | undefined,
  workspace: ProofolioWorkspace,
) {
  if (!token) return null;

  const database = await readDatabase();
  const tokenHash = getTokenHash(token);
  const now = Date.now();
  const account = database.accounts.find((item) =>
    item.sessions.some(
      (session) =>
        session.tokenHash === tokenHash &&
        new Date(session.expiresAt).getTime() > now,
    ),
  );

  if (!account) return null;

  account.workspace = normalizeProofolioWorkspace(workspace);
  account.updatedAt = new Date().toISOString();
  removeExpiredSessions(account, now);
  await writeDatabase(database);

  return {
    user: getPublicUser(account),
    workspace: account.workspace,
  };
}

export async function logoutSessionToken(token: string | undefined) {
  if (!token) return;

  const database = await readDatabase();
  const tokenHash = getTokenHash(token);

  for (const account of database.accounts) {
    account.sessions = account.sessions.filter(
      (session) => session.tokenHash !== tokenHash,
    );
  }

  await writeDatabase(database);
}
