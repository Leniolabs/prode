/**
 * Phase 1C — SQL/TS divergence harness.
 *
 * Goal: detect every spot where the SQL scoring in `utils/raw.ts` disagrees
 * with the TS scoring in `utils/queries.ts` for the fixtures pinned by Phase
 * 1B. This is a divergence report, not a green/red test — we only fail if the
 * harness itself crashes (DB unreachable, SQL syntax error). Disagreements are
 * logged into `tests/sql/divergence-report.md`.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, Stage } from '@/generated/prisma';
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

import {
  computeGroupMatchPoints,
  computeFinalMatchPoints,
  finalMatchPoints,
} from "@/utils/queries";
import { getSubqueryFinals, getSubqueryGroups } from "@/utils/raw";
import {
  FINALS_SCORING,
  GROUP_MATCH_SCORING,
} from "@test/fixtures/scoring";

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://leniolabs:leniolabs@localhost:5433/prode_test";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

const REPORT_PATH = "tests/sql/divergence-report.md";

// Country IDs the fixtures reference. We pre-create these as `Country` rows so
// the FKs on Match and ProdeUserFinalsMatch resolve.
const COUNTRY_IDS = ["BRA", "ARG", "GER", "FRA"] as const;

const PRODE_ID = "test-prode-1c";
const ROOM_ID_PREFIX = "room-1c-";
const USER_ID_PREFIX = "user-1c-";
const USERPRODE_ID_PREFIX = "up-1c-";
const MATCH_ID_PREFIX = "match-1c-";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60);
}

async function cleanDb() {
  // Wipe in FK-safe order. Match/UserProde rows live behind these.
  await prisma.prodeUserFinalsMatch.deleteMany({});
  await prisma.prodeUserGroupMatch.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.userProde.deleteMany({});
  await prisma.prodeRoom.deleteMany({});
  await prisma.prode.deleteMany({});
  // Users + Countries are reusable across fixtures.
}

async function ensureGlobals() {
  // Countries — explicit IDs so FK from Match works.
  for (const id of COUNTRY_IDS) {
    await prisma.country.upsert({
      where: { id },
      create: { id, code: id, name: id },
      update: {},
    });
  }

  // One shared Prode row (single-tournament assumption matches the app).
  const now = new Date("2026-06-01");
  await prisma.prode.upsert({
    where: { id: PRODE_ID },
    create: {
      id: PRODE_ID,
      stage: "FINALS",
      created: now,
      groupSubmissionsEnd: now,
      finalsSubmissionsEnd: now,
      prodeEnd: now,
    },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------

type Row = {
  index: number;
  category: "FINALS" | "GROUP";
  name: string;
  ts: number;
  sql: number | null;
  delta: number | null;
  hypothesis: string;
};

/**
 * Compute a human-readable hypothesis tag for a row.
 * delta = TS - SQL. Positive delta means TS scored higher.
 */
function categoryLabel(diff: number | null, ts: number, sql: number | null) {
  if (sql === null) return "SQL query returned no row (no prediction matched)";
  if (diff === null) return "uncomparable";
  if (diff === 0) return "agrees";
  if (ts === 0 && sql > 0) return "SQL credits a case TS treats as 0";
  if (sql === 0 && ts > 0) return "SQL misses a case TS credits";
  if (diff < 0) return "SQL scores more than TS (over-credit)";
  return "SQL scores less than TS (under-credit)";
}

function buildReport(rows: Row[]): string {
  const diverged = rows.filter((r) => (r.delta ?? 0) !== 0).length;
  const finals = rows.filter((r) => r.category === "FINALS");
  const groups = rows.filter((r) => r.category === "GROUP");

  // Bucket divergence types by hypothesis-tag.
  const buckets = new Map<string, number>();
  for (const r of rows) {
    if ((r.delta ?? 0) === 0) continue;
    buckets.set(r.hypothesis, (buckets.get(r.hypothesis) ?? 0) + 1);
  }

  const summaryLines: string[] = [];
  summaryLines.push(
    `Tested ${rows.length} fixture rows (${finals.length} FINALS_SCORING + ${groups.length} GROUP_MATCH_SCORING). ${diverged} diverged.`
  );
  if (buckets.size > 0) {
    summaryLines.push("Divergence categories:");
    const entries: [string, number][] = [];
    buckets.forEach((v, k) => entries.push([k, v]));
    entries.sort((a, b) => b[1] - a[1]);
    for (const [k, v] of entries) {
      summaryLines.push(`- ${v}x ${k}`);
    }
  } else {
    summaryLines.push("No divergences observed.");
  }

  const header =
    "| # | category | fixture name | TS | SQL | Δ | hypothesis |\n" +
    "|---|---|---|---|---|---|---|";

  const lines = rows.map((r) => {
    const sql = r.sql === null ? "—" : String(r.sql);
    const delta = r.delta === null ? "—" : String(r.delta);
    const diverged = (r.delta ?? 0) !== 0;
    const marker = diverged ? "**" : "";
    return `| ${r.index} | ${r.category} | ${marker}${r.name.replace(/\|/g, "\\|")}${marker} | ${r.ts} | ${sql} | ${delta} | ${r.hypothesis} |`;
  });

  return [
    "# SQL ↔ TS scoring divergence report",
    "",
    "_Generated by `tests/sql/divergence.test.ts` on every run; overwritten in place._",
    "",
    summaryLines.join("\n"),
    "",
    "## Per-fixture results",
    "",
    header,
    ...lines,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("SQL ↔ TS scoring divergence", () => {
  const allRows: Row[] = [];

  beforeAll(async () => {
    // Sanity-check the DB is reachable; if not, this throws and the test
    // (correctly) fails.
    await prisma.$queryRaw`SELECT 1`;
    await cleanDb();
    await ensureGlobals();
  }, 30_000);

  afterAll(async () => {
    // Always write the report — even on partial runs.
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, buildReport(allRows), "utf8");
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // FINALS pass
  // -------------------------------------------------------------------------

  it.each(FINALS_SCORING.map((f, i) => ({ ...f, _i: i })))(
    "FINALS[%#] $name",
    async (fx) => {
      const i = (fx as any)._i as number;
      const fixture = FINALS_SCORING[i];
      const room = fixture.room;
      const userMatch = fixture.userMatch as (typeof fixture)["userMatch"];

      // Per-fixture identifiers — keep them unique so rows don't collide.
      const slug = `${i}-${slugify(fixture.name)}`;
      const roomId = `${ROOM_ID_PREFIX}f-${slug}`;
      const userId = `${USER_ID_PREFIX}f-${slug}`;
      const userProdeId = `${USERPRODE_ID_PREFIX}f-${slug}`;
      const matchId = `${MATCH_ID_PREFIX}f-${slug}`;

      const now = new Date("2026-06-01");

      // Seed: User, Room, UserProde, Match, Prediction.
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: `${userId}@test.local`,
          name: userId,
        },
        update: {},
      });

      await prisma.prodeRoom.create({
        data: {
          id: roomId,
          name: `room-${slug}`,
          public: true,
          created: now,
          userId,
          prodeId: PRODE_ID,
          pointsWinner: room.pointsWinner,
          pointsGoals: room.pointsGoals,
          pointsPenal: room.pointsPenal,
        },
      });

      await prisma.userProde.create({
        data: {
          id: userProdeId,
          created: now,
          userId,
          prodeId: PRODE_ID,
          prodeRoomId: roomId,
        },
      });

      // The match — pull goals + penalties + countries from the fixture's
      // match stub. Use FINALS as the stage; it's a leaf stage in the enum.
      const match = userMatch.match;
      await prisma.match.create({
        data: {
          id: matchId,
          date: now,
          stage: "FINALS" as Stage,
          goalsLeft: match.goalsLeft,
          goalsRight: match.goalsRight,
          penaltisLeft: match.penaltisLeft,
          penaltisRight: match.penaltisRight,
          filled: match.filled ?? true,
          countryLeftId: match.countryLeftId ?? "BRA",
          countryRightId: match.countryRightId ?? "ARG",
          prodeId: PRODE_ID,
        },
      });

      // The user prediction. Note: ProdeUserFinalsMatch.countryLeftId and
      // countryRightId are NOT NULL FKs to Country; we pre-created BRA, ARG,
      // GER, FRA in ensureGlobals().
      await prisma.prodeUserFinalsMatch.create({
        data: {
          goalsLeft: userMatch.goalsLeft,
          goalsRight: userMatch.goalsRight,
          penaltisLeft: userMatch.penaltisLeft ?? null,
          penaltisRight: userMatch.penaltisRight ?? null,
          countryLeftId: userMatch.countryLeftId,
          countryRightId: userMatch.countryRightId,
          userProdeId,
          matchId,
        },
      });

      // TS side: sum of finalMatchPoints over the one user prediction.
      const tsTotal = computeFinalMatchPoints(room as any, [userMatch] as any);

      // SQL side: run the subquery; it groups by userProdeId, so we filter
      // back to this user's row.
      const roomForQuery = {
        ...room,
        id: roomId,
      } as any;
      const sqlText = getSubqueryFinals(roomForQuery);

      // Wrap so we can filter to this user's row.
      const wrapped = `SELECT s."userProdeId", s.points FROM (${sqlText}) s WHERE s."userProdeId" = '${userProdeId}'`;

      type Result = { userProdeId: string; points: number | string | bigint };
      const result = (await prisma.$queryRawUnsafe(wrapped)) as Result[];

      const sqlTotal =
        result.length === 0 ? null : Number(result[0].points);

      const delta = sqlTotal === null ? null : tsTotal - sqlTotal;
      const hypothesis = categoryLabel(delta, tsTotal, sqlTotal);

      allRows.push({
        index: i,
        category: "FINALS",
        name: fixture.name,
        ts: tsTotal,
        sql: sqlTotal,
        delta,
        hypothesis,
      });

      // Report-only test: never assert.
      expect(true).toBe(true);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // GROUP pass
  // -------------------------------------------------------------------------

  it.each(GROUP_MATCH_SCORING.map((f, i) => ({ ...f, _i: i })))(
    "GROUP[%#] $name",
    async (fx) => {
      const i = (fx as any)._i as number;
      const fixture = GROUP_MATCH_SCORING[i];
      const room = fixture.room;

      const slug = `${i}-${slugify(fixture.name)}`;
      const roomId = `${ROOM_ID_PREFIX}g-${slug}`;
      const userId = `${USER_ID_PREFIX}g-${slug}`;
      const userProdeId = `${USERPRODE_ID_PREFIX}g-${slug}`;

      const now = new Date("2026-06-01");

      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: `${userId}@test.local`,
          name: userId,
        },
        update: {},
      });

      await prisma.prodeRoom.create({
        data: {
          id: roomId,
          name: `room-${slug}`,
          public: true,
          created: now,
          userId,
          prodeId: PRODE_ID,
          pointsWinner: room.pointsWinner,
          pointsGoals: room.pointsGoals,
          pointsPenal: room.pointsPenal,
        },
      });

      await prisma.userProde.create({
        data: {
          id: userProdeId,
          created: now,
          userId,
          prodeId: PRODE_ID,
          prodeRoomId: roomId,
        },
      });

      // Seed each match + group prediction. With an empty userMatches array,
      // the SQL subquery will return no row for this user — handled below.
      let matchOrdinal = 0;
      for (const userMatch of fixture.userMatches) {
        const matchId = `${MATCH_ID_PREFIX}g-${slug}-${matchOrdinal++}`;
        const match = userMatch.match;

        await prisma.match.create({
          data: {
            id: matchId,
            date: now,
            stage: "GROUP_A" as Stage,
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
            penaltisLeft: match.penaltisLeft,
            penaltisRight: match.penaltisRight,
            filled: match.filled ?? true,
            countryLeftId: match.countryLeftId ?? "BRA",
            countryRightId: match.countryRightId ?? "ARG",
            prodeId: PRODE_ID,
          },
        });

        await prisma.prodeUserGroupMatch.create({
          data: {
            goalsLeft: userMatch.goalsLeft,
            goalsRight: userMatch.goalsRight,
            userProdeId,
            matchId,
          },
        });
      }

      const tsTotal = computeGroupMatchPoints(
        room as any,
        fixture.userMatches as any
      );

      const roomForQuery = { ...room, id: roomId } as any;
      const sqlText = getSubqueryGroups(roomForQuery);
      const wrapped = `SELECT s."userProdeId", s.points FROM (${sqlText}) s WHERE s."userProdeId" = '${userProdeId}'`;

      type Result = { userProdeId: string; points: number | string | bigint };
      const result = (await prisma.$queryRawUnsafe(wrapped)) as Result[];

      // Empty fixture or non-matched: treat missing row as 0 (mirrors how the
      // outer ranking query coalesces a missing left-join row to 0).
      const sqlTotal =
        result.length === 0 ? 0 : Number(result[0].points);

      const delta = tsTotal - sqlTotal;
      const hypothesis = categoryLabel(delta, tsTotal, sqlTotal);

      allRows.push({
        index: i,
        category: "GROUP",
        name: fixture.name,
        ts: tsTotal,
        sql: sqlTotal,
        delta,
        hypothesis,
      });

      expect(true).toBe(true);
    },
    30_000
  );
});
