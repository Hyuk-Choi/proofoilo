"use client";

import type { ProofolioWorkspace } from "@/types/proofolio";

export type ProofolioClientAccount = {
  id: string;
  email: string;
  name: string;
};

export type ProofolioAccountState =
  | { status: "checking"; user?: ProofolioClientAccount }
  | { status: "guest"; user?: undefined }
  | { status: "authenticated"; user: ProofolioClientAccount };

type AccountResponse = {
  user: ProofolioClientAccount;
  workspace: ProofolioWorkspace;
};

const ACCOUNT_STORAGE_KEY = "proofolio-account-v1";
export const PROOFOLIO_ACCOUNT_UPDATED_EVENT =
  "proofolio-account-updated";

let syncTimer: number | undefined;
let latestWorkspaceForSync: ProofolioWorkspace | undefined;

function buildWorkspaceSyncPayload(workspace: ProofolioWorkspace) {
  return JSON.stringify({ workspace });
}

function dispatchAccountUpdate(user?: ProofolioClientAccount) {
  window.dispatchEvent(
    new CustomEvent<ProofolioClientAccount | undefined>(
      PROOFOLIO_ACCOUNT_UPDATED_EVENT,
      { detail: user },
    ),
  );
}

export function loadAccountFromLocalStorage() {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<ProofolioClientAccount>;

    if (
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.name === "string"
    ) {
      return parsed as ProofolioClientAccount;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function saveAccountToLocalStorage(user: ProofolioClientAccount) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(user));
  dispatchAccountUpdate(user);
}

export function clearAccountFromLocalStorage() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  dispatchAccountUpdate(undefined);
}

export async function fetchCurrentAccount() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) return undefined;
  return (await response.json()) as AccountResponse;
}

export async function loginToAccount(input: {
  email: string;
  password: string;
  name?: string;
  workspace: ProofolioWorkspace;
}) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as
    | AccountResponse
    | { message?: string };

  if (!response.ok || !("user" in payload)) {
    throw new Error(
      "message" in payload && payload.message
        ? payload.message
        : "로그인에 실패했습니다.",
    );
  }

  saveAccountToLocalStorage(payload.user);
  return payload;
}

export async function logoutAccount() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
  clearAccountFromLocalStorage();
}

export function rememberAccountWorkspaceSnapshot(
  workspace: ProofolioWorkspace,
) {
  latestWorkspaceForSync = workspace;
}

export function flushAccountWorkspaceSync(
  workspace: ProofolioWorkspace | undefined = latestWorkspaceForSync,
) {
  if (typeof window === "undefined" || !workspace) return false;

  latestWorkspaceForSync = workspace;

  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = undefined;
  }

  const payload = buildWorkspaceSyncPayload(workspace);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const queued = navigator.sendBeacon(
      "/api/workspace/sync",
      new Blob([payload], { type: "application/json" }),
    );

    if (queued) return true;
  }

  fetch("/api/workspace/sync", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);

  return true;
}

export function scheduleAccountWorkspaceSync(workspace: ProofolioWorkspace) {
  if (typeof window === "undefined") return;

  latestWorkspaceForSync = workspace;

  if (syncTimer) {
    window.clearTimeout(syncTimer);
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = undefined;

    const workspaceToSync = latestWorkspaceForSync;
    if (!workspaceToSync) return;

    fetch("/api/workspace", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: buildWorkspaceSyncPayload(workspaceToSync),
    }).catch(() => undefined);
  }, 550);
}
