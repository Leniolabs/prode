import { prisma } from "@/lib/prisma";
import { fetchScoreboard, isFinal, type EspnEvent, type EspnCompetitor } from "./client";

const PG_INT_MAX = 2147483647;

export type SyncResult = {
  checked: number;
  updated: number;
  skipped: number;
  errors: string[];
};

/**
 * Syncs finished match results from ESPN's keyless scoreboard into the DB.
 *
 * Strategy, per final event:
 *  1. Fast path: match already linked by apiFixtureId (ESPN event id).
 *  2. Slow path: link by both teams' externalId (ESPN team id) + date window (±12h),
 *     trying the swapped home/away order too.
 *  3. Skip matches already filled with the same score (idempotent).
 *  4. Write goals (regulation score) + penalties (shootoutScore) and set filled=true.
 */
export async function syncMatchResults(date?: string): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, updated: 0, skipped: 0, errors: [] };

  const dates = date ? [date] : tournamentDates();

  let events: EspnEvent[] = [];
  for (const d of dates) {
    try {
      events = events.concat(await fetchScoreboard(d));
    } catch (err) {
      result.errors.push(
        `ESPN fetch failed for ${d}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const finished = events.filter(isFinal);
  result.checked = finished.length;

  for (const event of finished) {
    try {
      await processEvent(event, result);
    } catch (err) {
      result.errors.push(
        `event ${event.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}

async function processEvent(event: EspnEvent, result: SyncResult) {
  const competitors = event.competitions[0]?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");

  if (!home || !away) {
    result.skipped++;
    return;
  }

  const goalsHome = parseScore(home.score);
  const goalsAway = parseScore(away.score);
  if (goalsHome === null || goalsAway === null) {
    result.skipped++;
    return;
  }

  const penHome = parseScore(home.shootoutScore);
  const penAway = parseScore(away.shootoutScore);

  const eventId = Number(event.id);
  const fixtureId = Number.isInteger(eventId) && eventId <= PG_INT_MAX ? eventId : null;

  const [homeCountry, awayCountry] = await Promise.all([
    countryByEspnId(home),
    countryByEspnId(away),
  ]);

  if (!homeCountry || !awayCountry) {
    result.skipped++;
    return;
  }

  // Fast path: already linked by ESPN event id.
  let match = fixtureId !== null
    ? await prisma.match.findUnique({ where: { apiFixtureId: fixtureId } })
    : null;

  // Slow path: match by team externalIds + date window.
  if (!match) {
    const matchDate = new Date(event.date);
    const windowStart = new Date(matchDate.getTime() - 12 * 3600 * 1000);
    const windowEnd = new Date(matchDate.getTime() + 12 * 3600 * 1000);

    match = await prisma.match.findFirst({
      where: {
        countryLeftId: homeCountry.id,
        countryRightId: awayCountry.id,
        date: { gte: windowStart, lte: windowEnd },
      },
    });

    if (!match) {
      match = await prisma.match.findFirst({
        where: {
          countryLeftId: awayCountry.id,
          countryRightId: homeCountry.id,
          date: { gte: windowStart, lte: windowEnd },
        },
      });
    }
  }

  if (!match) {
    result.skipped++;
    return;
  }

  // Orient the score to our stored home/away (DB may have teams swapped).
  const leftIsHome = match.countryLeftId === homeCountry.id;

  const goalsLeft = leftIsHome ? goalsHome : goalsAway;
  const goalsRight = leftIsHome ? goalsAway : goalsHome;
  const penaltisLeft = leftIsHome ? penHome : penAway;
  const penaltisRight = leftIsHome ? penAway : penHome;

  if (
    match.filled &&
    match.goalsLeft === goalsLeft &&
    match.goalsRight === goalsRight &&
    match.penaltisLeft === penaltisLeft &&
    match.penaltisRight === penaltisRight
  ) {
    result.skipped++;
    return;
  }

  await prisma.match.update({
    where: { id: match.id },
    data: {
      goalsLeft,
      goalsRight,
      penaltisLeft,
      penaltisRight,
      filled: true,
      ...(fixtureId !== null ? { apiFixtureId: fixtureId } : {}),
    },
  });

  result.updated++;
}

function parseScore(raw: string | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function countryByEspnId(c: EspnCompetitor) {
  const externalId = Number(c.team.id);
  if (!Number.isInteger(externalId)) return null;
  return prisma.country.findUnique({ where: { externalId } });
}

/** Every day of WC 2026 (2026-06-11 to 2026-07-19) as YYYY-MM-DD. */
function tournamentDates(): string[] {
  const start = new Date("2026-06-11T00:00:00.000Z");
  const end = new Date("2026-07-19T00:00:00.000Z");
  const out: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
