import { prisma } from "@/lib/prisma";
import { fetchMatches, type ApiSportsMatch } from "./client";

const MATCH_WINDOW_MS = 12 * 60 * 60 * 1000;

export type SyncResult = {
  fetched: number;
  pending: number;
  checked: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type PendingMatch = {
  id: string;
  apiFixtureId: number | null;
  date: Date;
  filled: boolean;
  goalsLeft: number | null;
  goalsRight: number | null;
  penaltisLeft: number | null;
  penaltisRight: number | null;
  countryLeftCode: string | null;
  countryRightCode: string | null;
};

export type PendingMatchResolution = {
  match: PendingMatch;
  leftIsHome: boolean;
};

export function shouldSyncApiMatch(match: ApiSportsMatch, now: Date): boolean {
  if (match.homeScore === null || match.awayScore === null) {
    return false;
  }

  if (!match.homeTeamCode || !match.awayTeamCode) {
    return false;
  }

  const kickoff = new Date(match.kickoffUtc);
  if (Number.isNaN(kickoff.getTime())) {
    return false;
  }

  return kickoff.getTime() < now.getTime();
}

export function findPendingMatch(
  apiMatch: ApiSportsMatch,
  pendingMatches: PendingMatch[],
  usedMatchIds: Set<string>,
): PendingMatchResolution | null {
  const linkedMatch = pendingMatches.find(
    (match) => match.apiFixtureId === apiMatch.id && !usedMatchIds.has(match.id),
  );

  if (linkedMatch) {
    return {
      match: linkedMatch,
      leftIsHome: linkedMatch.countryLeftCode === apiMatch.homeTeamCode,
    };
  }

  const kickoff = new Date(apiMatch.kickoffUtc);
  if (Number.isNaN(kickoff.getTime())) {
    return null;
  }

  const candidates = pendingMatches
    .filter((match) => {
      if (usedMatchIds.has(match.id)) {
        return false;
      }

      const diff = Math.abs(match.date.getTime() - kickoff.getTime());
      if (diff > MATCH_WINDOW_MS) {
        return false;
      }

      const exactOrder =
        match.countryLeftCode === apiMatch.homeTeamCode &&
        match.countryRightCode === apiMatch.awayTeamCode;
      const swappedOrder =
        match.countryLeftCode === apiMatch.awayTeamCode &&
        match.countryRightCode === apiMatch.homeTeamCode;

      return exactOrder || swappedOrder;
    })
    .sort(
      (left, right) =>
        Math.abs(left.date.getTime() - kickoff.getTime()) -
        Math.abs(right.date.getTime() - kickoff.getTime()),
    );

  const match = candidates[0];
  if (!match) {
    return null;
  }

  return {
    match,
    leftIsHome: match.countryLeftCode === apiMatch.homeTeamCode,
  };
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

  const pendingMatches = await prisma.match.findMany({
    where: {
      date: { lt: now },
      OR: [
        { goalsLeft: null },
        { goalsRight: null },
        { filled: false },
      ],
    },
    select: {
      id: true,
      apiFixtureId: true,
      date: true,
      filled: true,
      goalsLeft: true,
      goalsRight: true,
      penaltisLeft: true,
      penaltisRight: true,
      countryLeft: { select: { code: true } },
      countryRight: { select: { code: true } },
    },
    orderBy: { date: "asc" },
  });

  const normalizedPending: PendingMatch[] = pendingMatches.map((match) => ({
    id: match.id,
    apiFixtureId: match.apiFixtureId,
    date: match.date,
    filled: match.filled,
    goalsLeft: match.goalsLeft,
    goalsRight: match.goalsRight,
    penaltisLeft: match.penaltisLeft,
    penaltisRight: match.penaltisRight,
    countryLeftCode: match.countryLeft?.code ?? null,
    countryRightCode: match.countryRight?.code ?? null,
  }));

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

      const { match, leftIsHome } = resolution;
      const goalsLeft = leftIsHome ? apiMatch.homeScore : apiMatch.awayScore;
      const goalsRight = leftIsHome ? apiMatch.awayScore : apiMatch.homeScore;
      const penaltisLeft = leftIsHome ? apiMatch.homePen : apiMatch.awayPen;
      const penaltisRight = leftIsHome ? apiMatch.awayPen : apiMatch.homePen;

      const alreadySynced =
        match.filled &&
        match.goalsLeft === goalsLeft &&
        match.goalsRight === goalsRight &&
        match.penaltisLeft === penaltisLeft &&
        match.penaltisRight === penaltisRight &&
        match.apiFixtureId === apiMatch.id;

      if (alreadySynced) {
        usedMatchIds.add(match.id);
        result.skipped++;
        continue;
      }

      await prisma.match.update({
        where: { id: match.id },
        data: {
          goalsLeft,
          goalsRight,
          penaltisLeft,
          penaltisRight,
          filled: true,
          apiFixtureId: apiMatch.id,
        },
      });

      usedMatchIds.add(match.id);
      result.updated++;
    } catch (error) {
      result.errors.push(
        `match ${apiMatch.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return result;
}
