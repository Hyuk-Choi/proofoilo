export { PROOFOLIO_SCHEMA_VERSION, PROOFOLIO_STORAGE_KEY } from "./keys";
export {
  createDefaultUserProfile,
  createEmptyProofolioWorkspace,
  normalizeProofolioWorkspace,
} from "./migrations";
export {
  clearProofolioLocalStorage,
  loadFromLocalStorage,
  PROOFOLIO_WORKSPACE_UPDATED_EVENT,
  saveToLocalStorage,
  type StorageAdapter,
} from "./proofolio-storage";
