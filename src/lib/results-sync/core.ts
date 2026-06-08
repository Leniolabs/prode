import { prisma } from "@/lib/prisma";

const MATCH_WINDOW_MS = 12 * 60 * 60 * 1000;

export type ProviderMatch = {
  id: number;
  kickoffUtc: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePen: number | null;
  awayPen: number | null;
  status: string | null;
  phase: string | null;
};

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

export function shouldSyncProviderMatch(match: ProviderMatch, now: Date): boolean {
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
  providerMatch: ProviderMatch,
  pendingMatches: PendingMatch[],
  usedMatchIds: Set<string>,
  options?: { allowFixtureIdLookup?: boolean },
): PendingMatchResolution | null {
  if (options?.allowFixtureIdLookup !== false) {
    const linkedMatch = pendingMatches.find(
      (match) => match.apiFixtureId === providerMatch.id && !usedMatchIds.has(match.id),
    );

    if (linkedMatch) {
      return {
        match: linkedMatch,
        leftIsHome: linkedMatch.countryLeftCode === providerMatch.homeTeamCode,
      };
    }
  }

  const kickoff = new Date(providerMatch.kickoffUtc);
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
        match.countryLeftCode === providerMatch.homeTeamCode &&
        match.countryRightCode === providerMatch.awayTeamCode;
      const swappedOrder =
        match.countryLeftCode === providerMatch.awayTeamCode &&
        match.countryRightCode === providerMatch.homeTeamCode;

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
    leftIsHome: match.countryLeftCode === providerMatch.homeTeamCode,
  };
}

export async function loadPendingMatches(now: Date): Promise<PendingMatch[]> {
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

  return pendingMatches.map((match) => ({
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
}

export async function applyProviderMatch(
  providerMatch: ProviderMatch,
  resolution: PendingMatchResolution,
  options?: { persistFixtureId?: boolean },
): Promise<"updated" | "skipped"> {
  const { match, leftIsHome } = resolution;
  const goalsLeft = leftIsHome ? providerMatch.homeScore : providerMatch.awayScore;
  const goalsRight = leftIsHome ? providerMatch.awayScore : providerMatch.homeScore;
  const penaltisLeft = leftIsHome ? providerMatch.homePen : providerMatch.awayPen;
  const penaltisRight = leftIsHome ? providerMatch.awayPen : providerMatch.homePen;

  const alreadySynced =
    match.filled &&
    match.goalsLeft === goalsLeft &&
    match.goalsRight === goalsRight &&
    match.penaltisLeft === penaltisLeft &&
    match.penaltisRight === penaltisRight &&
    (options?.persistFixtureId === false || match.apiFixtureId === providerMatch.id);

  if (alreadySynced) {
    return "skipped";
  }

  await prisma.match.update({
    where: { id: match.id },
    data: {
      goalsLeft,
      goalsRight,
      penaltisLeft,
      penaltisRight,
      filled: true,
      ...(options?.persistFixtureId === false ? {} : { apiFixtureId: providerMatch.id }),
    },
  });

  return "updated";
}
