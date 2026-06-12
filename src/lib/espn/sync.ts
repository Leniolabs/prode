import {
  applyProviderMatch,
  findPendingMatch,
  loadPendingMatches,
  shouldSyncProviderMatch,
  type ProviderMatch,
  type SyncResult,
} from "@/lib/results-sync/core";
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

  return result;
}
