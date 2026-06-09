import { fetchMatches, type ApiSportsMatch } from "./client";
import {
  applyProviderMatch,
  findPendingMatch,
  loadPendingMatches,
  shouldSyncProviderMatch,
  type PendingMatch,
  type PendingMatchResolution,
  type SyncResult,
} from "@/lib/results-sync/core";

export { findPendingMatch };
export type { PendingMatch, PendingMatchResolution, SyncResult };

export function shouldSyncApiMatch(match: ApiSportsMatch, now: Date): boolean {
  return shouldSyncProviderMatch(match, now);
}

export async function syncMatchResults(): Promise<SyncResult> {
  const now = new Date();
  const result: SyncResult = {
    fetched: 0,
    pending: 0,
    checked: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const normalizedPending = await loadPendingMatches(now);

  result.pending = normalizedPending.length;
  if (normalizedPending.length === 0) {
    return result;
  }

  const apiMatches = await fetchMatches();
  result.fetched = apiMatches.length;

  const syncableMatches = apiMatches.filter((match) => shouldSyncApiMatch(match, now));
  result.checked = syncableMatches.length;

  const usedMatchIds = new Set<string>();

  for (const apiMatch of syncableMatches) {
    try {
      const resolution = findPendingMatch(apiMatch, normalizedPending, usedMatchIds);
      if (!resolution) {
        result.skipped++;
        continue;
      }
      const outcome = await applyProviderMatch(apiMatch, resolution);
      usedMatchIds.add(resolution.match.id);
      if (outcome === "updated") {
        result.updated++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push(
        `match ${apiMatch.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return result;
}
