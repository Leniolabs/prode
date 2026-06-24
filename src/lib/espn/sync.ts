import {
  advanceFinalsBracket,
  applyProviderMatch,
  findPendingMatch,
  loadPendingMatches,
  shouldSyncProviderMatch,
  type ProviderMatch,
  type SyncResult,
} from "@/lib/results-sync/core";
import { seedRoundOf32All } from "@/lib/bracket";
import { reconcileRoundOf32 } from "./reconcile";
import { fetchScoreboardRange, isFinal, type EspnCompetitor, type EspnEvent } from "./client";

function parseScore(raw: string | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeEvent(event: EspnEvent): ProviderMatch | null {
  if (!isFinal(event)) {
    return null;
  }

  const competitors = event.competitions[0]?.competitors ?? [];
  const home = competitors.find((entry) => entry.homeAway === "home");
  const away = competitors.find((entry) => entry.homeAway === "away");

  if (!home || !away) {
    return null;
  }

  const id = Number(event.id);
  if (!Number.isInteger(id)) {
    return null;
  }

  return {
    id,
    kickoffUtc: event.date,
    homeTeamCode: normalizeTeamCode(home),
    awayTeamCode: normalizeTeamCode(away),
    homeScore: parseScore(home.score),
    awayScore: parseScore(away.score),
    homePen: parseScore(home.shootoutScore),
    awayPen: parseScore(away.shootoutScore),
    status: event.status.type.description ?? event.status.type.name ?? null,
    phase: event.status.type.detail ?? null,
  };
}

function normalizeTeamCode(competitor: EspnCompetitor): string | null {
  const code = competitor.team.abbreviation?.trim().toUpperCase();
  return code ? code : null;
}

export function buildScoreboardDateRange(dates: Date[]): string | null {
  if (dates.length === 0) {
    return null;
  }

  const sorted = [...dates].sort((left, right) => left.getTime() - right.getTime());
  // ESPN buckets the scoreboard by US-local date, so a UTC kickoff in the early
  // hours lands on the prior calendar day. Pad both ends by a day to cover it.
  const start = formatDate(addDays(sorted[0], -1));
  const end = formatDate(addDays(sorted[sorted.length - 1], 1));
  return `${start}-${end}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
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

  const pendingMatches = await loadPendingMatches(now);
  result.pending = pendingMatches.length;
  if (pendingMatches.length === 0) {
    return result;
  }

  const dateRange = buildScoreboardDateRange(pendingMatches.map((match) => match.date));
  if (!dateRange) {
    return result;
  }

  const events = await fetchScoreboardRange(dateRange);
  result.fetched = events.length;

  const providerMatches = events
    .map((event) => normalizeEvent(event))
    .filter((match): match is ProviderMatch => match !== null)
    .filter((match) => shouldSyncProviderMatch(match, now));

  result.checked = providerMatches.length;

  const usedMatchIds = new Set<string>();

  for (const providerMatch of providerMatches) {
    try {
      const resolution = findPendingMatch(providerMatch, pendingMatches, usedMatchIds, {
        allowFixtureIdLookup: false,
      });
      if (!resolution) {
        result.skipped++;
        continue;
      }

      const outcome = await applyProviderMatch(providerMatch, resolution, {
        persistFixtureId: false,
      });
      usedMatchIds.add(resolution.match.id);
      if (outcome === "updated") {
        result.updated++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push(
        `match ${providerMatch.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (result.updated > 0) {
    // Seed the round of 32 from group standings once groups are final, then
    // propagate knockout winners up the bracket. Seeding runs first so any R32
    // results already pulled in this pass can advance in the same call.
    try {
      await seedRoundOf32All();
    } catch (error) {
      result.errors.push(
        `r32 seed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      await advanceFinalsBracket();
    } catch (error) {
      result.errors.push(
        `bracket advance: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Validate the computed round-of-32 against the official bracket published by
  // ESPN. Detective control: logs divergences (chiefly third-place tiebreakers
  // we cannot derive from scores), never mutates the bracket. Self-fetches the
  // R32 window and no-ops until at least one slot is seeded.
  try {
    const reconcile = await reconcileRoundOf32();
    result.reconcile = {
      matched: reconcile.matched,
      unmatched: reconcile.unmatched.length,
      divergences: reconcile.divergences,
    };
  } catch (error) {
    result.errors.push(
      `r32 reconcile: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return result;
}
