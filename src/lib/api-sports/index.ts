export { fetchMatches, type ApiSportsMatch } from "./client";
export {
  syncMatchResults,
  shouldSyncApiMatch,
  findPendingMatch,
} from "./sync";
export type { PendingMatch, PendingMatchResolution, SyncResult } from "./sync";
