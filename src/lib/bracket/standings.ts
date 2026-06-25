import type { Group, GroupMatchResult, TeamStanding } from "./types";

type Tally = Omit<TeamStanding, "rank">;

function emptyTally(countryId: string, group: Group): Tally {
  return {
    countryId,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyMatch(tally: Tally, scored: number, conceded: number): void {
  tally.played += 1;
  tally.goalsFor += scored;
  tally.goalsAgainst += conceded;
  tally.goalDifference = tally.goalsFor - tally.goalsAgainst;
  if (scored > conceded) {
    tally.won += 1;
    tally.points += 3;
  } else if (scored === conceded) {
    tally.drawn += 1;
    tally.points += 1;
  } else {
    tally.lost += 1;
  }
}

// Overall comparison: points, then goal difference, then goals scored.
// Returns negative when `a` ranks ahead of `b`.
function compareOverall(a: Tally, b: Tally): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  return b.goalsFor - a.goalsFor;
}

// Head-to-head comparison among a tied subset: points, goal difference, then
// goals scored counting only the matches played between the tied teams.
function compareHeadToHead(
  tied: Tally[],
  matches: GroupMatchResult[],
): (a: Tally, b: Tally) => number {
  const tiedIds = new Set(tied.map((t) => t.countryId));
  const h2h = new Map<string, Tally>();
  for (const t of tied) h2h.set(t.countryId, emptyTally(t.countryId, t.group));

  for (const m of matches) {
    if (!tiedIds.has(m.countryLeftId) || !tiedIds.has(m.countryRightId)) continue;
    applyMatch(h2h.get(m.countryLeftId)!, m.goalsLeft, m.goalsRight);
    applyMatch(h2h.get(m.countryRightId)!, m.goalsRight, m.goalsLeft);
  }

  return (a, b) => compareOverall(h2h.get(a.countryId)!, h2h.get(b.countryId)!);
}

// Computes the final standings of a single group. FIFA tiebreakers applied:
// points, goal difference, goals scored, then head-to-head (points, GD, goals)
// among teams still level, then a stable fallback on countryId. Fair-play and
// FIFA-ranking criteria are not modelled (no source data); ties beyond goals
// scored fall back to a deterministic order.
export function computeGroupStandings(
  group: Group,
  matches: GroupMatchResult[],
): TeamStanding[] {
  const tallies = new Map<string, Tally>();
  const ensure = (id: string) => {
    let t = tallies.get(id);
    if (!t) {
      t = emptyTally(id, group);
      tallies.set(id, t);
    }
    return t;
  };

  for (const m of matches) {
    applyMatch(ensure(m.countryLeftId), m.goalsLeft, m.goalsRight);
    applyMatch(ensure(m.countryRightId), m.goalsRight, m.goalsLeft);
  }

  const sorted = Array.from(tallies.values()).sort((a, b) => {
    const overall = compareOverall(a, b);
    if (overall !== 0) return overall;
    return a.countryId < b.countryId ? -1 : a.countryId > b.countryId ? 1 : 0;
  });

  // Re-break ties between teams level on points/GD/goals using head-to-head.
  const result: Tally[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && compareOverall(sorted[i], sorted[j]) === 0) j++;
    const block = sorted.slice(i, j);
    if (block.length > 1) {
      const h2h = compareHeadToHead(block, matches);
      block.sort((a, b) => {
        const r = h2h(a, b);
        if (r !== 0) return r;
        return a.countryId < b.countryId ? -1 : a.countryId > b.countryId ? 1 : 0;
      });
    }
    result.push(...block);
    i = j;
  }

  return result.map((t, index) => ({ ...t, rank: index + 1 }));
}

// Ranks the third-placed teams across all groups and returns them best-first.
// Criteria: points, goal difference, goals scored, then a stable fallback on
// countryId (FIFA also uses fair-play and ranking, which we cannot model).
export function rankThirdPlaced(thirds: TeamStanding[]): TeamStanding[] {
  return [...thirds].sort((a, b) => {
    const overall = compareOverall(a, b);
    if (overall !== 0) return overall;
    return a.countryId < b.countryId ? -1 : a.countryId > b.countryId ? 1 : 0;
  });
}
