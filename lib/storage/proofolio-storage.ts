import type { ProofolioWorkspace } from "../../types/proofolio";
import { PROOFOLIO_STORAGE_KEY } from "./keys";
import {
  createEmptyProofolioWorkspace,
  normalizeProofolioWorkspace,
} from "./migrations";

export type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const PROOFOLIO_WORKSPACE_UPDATED_EVENT =
  "proofolio-workspace-updated";

function getBrowserStorage(): StorageAdapter | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveToLocalStorage(
  workspace: ProofolioWorkspace,
  storage: StorageAdapter | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;

  try {
    const nextWorkspace = normalizeProofolioWorkspace({
      ...workspace,
      updatedAt: new Date().toISOString(),
    });
    storage.setItem(PROOFOLIO_STORAGE_KEY, JSON.stringify(nextWorkspace));
    if (typeof window !== "undefined") {
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent<ProofolioWorkspace>(
            PROOFOLIO_WORKSPACE_UPDATED_EVENT,
            { detail: nextWorkspace },
          ),
        );
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage(
  fallback: ProofolioWorkspace = createEmptyProofolioWorkspace(),
  storage: StorageAdapter | null = getBrowserStorage(),
): ProofolioWorkspace {
  if (!storage) return normalizeProofolioWorkspace(fallback, fallback);

  try {
    const saved = storage.getItem(PROOFOLIO_STORAGE_KEY);
    if (!saved) return normalizeProofolioWorkspace(fallback, fallback);

    return normalizeProofolioWorkspace(JSON.parse(saved), fallback);
  } catch {
    return normalizeProofolioWorkspace(fallback, fallback);
  }
}

export function clearProofolioLocalStorage(
  storage: StorageAdapter | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.removeItem(PROOFOLIO_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
