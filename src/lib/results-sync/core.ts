import { prisma } from "@/lib/prisma";
import type { Stage } from "@/generated/prisma";
import {
  finalsSourceStages,
  getFinalsStageGroup,
  resolveFinalsMatches,
  type FinalsMatchLike,
} from "@/utils/finals";
import {
  getAdminFinalsMatchWinner,
  getAdminFinalsMatchLooser,
} from "@/lib/scoring/finals";

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

// Round-progression order. The visual order map in utils/finals.ts overlaps
// across rounds (FINALS_16_1 and FINALS_8_1 both rank 1), so we cannot reuse it
// here: resolveFinalsMatches requires every source round to be processed before
// the round that consumes it.
const FINALS_ROUND_INDEX: Record<string, number> = {
  FINALS_16: 0,
  FINALS_8: 1,
  FINALS_4: 2,
  FINALS_2: 3,
  FINAL: 4,
};

function collectFinalsStages(): Stage[] {
  const stages = new Set<string>();
  for (const [stage, source] of Object.entries(finalsSourceStages)) {
    stages.add(stage);
    stages.add(source.left);
    stages.add(source.right);
  }
  return Array.from(stages) as Stage[];
}

// Auto-advances the knockout bracket: once a source match has a decided result,
// its winner (or loser, for the third-place match) is written onto the next
// match's participant slots. Forward-only: a slot is only ever set or corrected
// to a decided team, never wiped back to null when the source is still pending.
export async function advanceFinalsBracket(): Promise<{ advanced: number }> {
  const matches = await prisma.match.findMany({
    where: { stage: { in: collectFinalsStages() } },
    select: {
      id: true,
      prodeId: true,
      stage: true,
      goalsLeft: true,
      goalsRight: true,
      penaltisLeft: true,
      penaltisRight: true,
      countryLeftId: true,
      countryRightId: true,
    },
  });

  const byProde = new Map<string, typeof matches>();
  for (const match of matches) {
    const list = byProde.get(match.prodeId) ?? [];
    list.push(match);
    byProde.set(match.prodeId, list);
  }

  let advanced = 0;

  for (const group of Array.from(byProde.values())) {
    const sorted = [...group].sort(
      (left, right) =>
        (FINALS_ROUND_INDEX[getFinalsStageGroup(left.stage) ?? ""] ?? 0) -
        (FINALS_ROUND_INDEX[getFinalsStageGroup(right.stage) ?? ""] ?? 0),
    );

    const input: (FinalsMatchLike & { id: string })[] = sorted.map((match) => ({
      id: match.id,
      stage: match.stage,
      countryLeftId: match.countryLeftId ?? undefined,
      countryRightId: match.countryRightId ?? undefined,
      goalsLeft: match.goalsLeft,
      goalsRight: match.goalsRight,
      penaltisLeft: match.penaltisLeft,
      penaltisRight: match.penaltisRight,
    }));

    const resolved = resolveFinalsMatches(
      input,
      getAdminFinalsMatchWinner,
      getAdminFinalsMatchLooser,
    );

    const stored = new Map(sorted.map((match) => [match.id, match]));

    for (const match of resolved) {
      if (!finalsSourceStages[match.stage]) continue;

      const original = stored.get(match.id);
      if (!original) continue;

      const data: { countryLeftId?: string; countryRightId?: string } = {};
      if (match.countryLeftId && match.countryLeftId !== original.countryLeftId) {
        data.countryLeftId = match.countryLeftId;
      }
      if (match.countryRightId && match.countryRightId !== original.countryRightId) {
        data.countryRightId = match.countryRightId;
      }

      if (Object.keys(data).length === 0) continue;

      await prisma.match.update({ where: { id: match.id }, data });
      advanced++;
    }
  }

  return { advanced };
}
