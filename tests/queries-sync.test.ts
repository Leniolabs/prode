/**
 * Phase 1D — characterization tests for syncronizeTemplate and
 * syncronizeFinalsTemplate in utils/queries.ts.
 *
 * These tests pin current observable DB behaviour (feature-driven, not
 * implementation-driven). Any row whose fixture name starts with
 * "pinned current behavior, may be a bug:" documents a surprising result
 * found during characterization.
 *
 * DB: Postgres at TEST_DATABASE_URL (default: localhost:5433/prode_test).
 * Boot it with: npm run test:db:up
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { syncronizeTemplate, syncronizeFinalsTemplate } from "@/utils/queries";
import {
  cleanDB,
  makeCountry,
  makeGroupPrediction,
  makeFinalsPrediction,
  makeMatch,
  makeProde,
  makeProdeRoom,
  makeRoomUserProde,
  makeTemplateUserProde,
  makeUser,
} from "@test/fixtures/queries-sync";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://leniolabs:leniolabs@localhost:5433/prode_test";

const pool = new Pool({ connectionString: TEST_DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

beforeAll(async () => {
  // Verify the DB is reachable — throw (fail fast) if not.
  await prisma.$queryRaw`SELECT 1`;
}, 30_000);

beforeEach(async () => {
  await cleanDB(prisma);
}, 30_000);

afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Shared seed helpers
// ---------------------------------------------------------------------------

/**
 * Seeds the minimal records needed by both syncronize* functions:
 *   User, Prode, ProdeRoom, room UserProde, template UserProde.
 *
 * Returns typed references so tests can use them directly.
 */
async function seedBase() {
  const userRow = makeUser();
  await prisma.user.create({ data: userRow });

  const prodeRow = makeProde();
  await prisma.prode.create({ data: prodeRow });

  const roomRow = makeProdeRoom({ userId: userRow.id, prodeId: prodeRow.id });
  await prisma.prodeRoom.create({ data: roomRow });

  const roomUp = makeRoomUserProde({
    userId: userRow.id,
    prodeId: prodeRow.id,
    prodeRoomId: roomRow.id,
  });
  await prisma.userProde.create({ data: roomUp });

  const templateUp = makeTemplateUserProde({
    userId: userRow.id,
    prodeId: prodeRow.id,
  });
  await prisma.userProde.create({ data: templateUp });

  // Minimal user shape that queries.ts functions accept (they use user.id).
  const user = { id: userRow.id } as Parameters<typeof syncronizeTemplate>[1];
  const room = { id: roomRow.id } as Parameters<typeof syncronizeTemplate>[0];

  return { user, room, prodeRow, roomUp, templateUp };
}

/**
 * Seeds the minimal records needed for syncronizeFinalsTemplate: all the
 * seedBase records plus two Country rows that ProdeUserFinalsMatch FKs need.
 */
async function seedBaseWithCountries() {
  const base = await seedBase();

  const countryA = makeCountry("TSA");
  const countryB = makeCountry("TSB");
  await prisma.country.createMany({ data: [countryA, countryB] });

  return { ...base, countryA, countryB };
}

// ---------------------------------------------------------------------------
// syncronizeTemplate
// ---------------------------------------------------------------------------

describe("syncronizeTemplate", () => {
  it(
    "room has a group prediction not in the template → prediction is created in the template",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp } = await seedBase();

      // Seed a match and a room prediction for it.
      const match = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: match });

      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
        }),
      });

      // Precondition: template has no predictions.
      const before = await prisma.prodeUserGroupMatch.count({
        where: { userProdeId: templateUp.id },
      });
      expect(before).toBe(0);

      await syncronizeTemplate(room, user);

      const rows = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].matchId).toBe(match.id);
      expect(rows[0].goalsLeft).toBe(2);
      expect(rows[0].goalsRight).toBe(1);
    },
    30_000
  );

  it(
    "room and template both have the same matchId → template row is updated to the room's goals",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp } = await seedBase();

      const match = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: match });

      // Seed room prediction (goals 2-1) and template prediction (goals 0-0).
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
        }),
      });
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: match.id,
          userProdeId: templateUp.id,
          goalsLeft: 0,
          goalsRight: 0,
        }),
      });

      await syncronizeTemplate(room, user);

      const rows = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].goalsLeft).toBe(2);
      expect(rows[0].goalsRight).toBe(1);
    },
    30_000
  );

  it(
    "template has a prediction for a match the room does not → that template row is left alone",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp } = await seedBase();

      // Match that exists ONLY in the template.
      const templateOnlyMatch = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: templateOnlyMatch });
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: templateOnlyMatch.id,
          userProdeId: templateUp.id,
          goalsLeft: 3,
          goalsRight: 2,
        }),
      });

      // Room has a different match.
      const roomMatch = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: roomMatch });
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: roomMatch.id,
          userProdeId: roomUp.id,
          goalsLeft: 1,
          goalsRight: 0,
        }),
      });

      await syncronizeTemplate(room, user);

      // Template should now have BOTH predictions (the original one + the new room one).
      const rows = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(2);

      const templateOnlyRow = rows.find(
        (r) => r.matchId === templateOnlyMatch.id
      );
      expect(templateOnlyRow).toBeDefined();
      expect(templateOnlyRow!.goalsLeft).toBe(3);
      expect(templateOnlyRow!.goalsRight).toBe(2);
    },
    30_000
  );

  it(
    "user has no template UserProde → function returns early, no writes",
    async () => {
      const { user, room, prodeRow, roomUp } = await seedBase();

      // Remove the template UserProde so the user has none.
      await prisma.userProde.deleteMany({
        where: { userId: user.id, template: true },
      });

      const match = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: match });
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
        }),
      });

      // Should not throw, should not write anything.
      const result = await syncronizeTemplate(room, user);

      // Function returns undefined (early return).
      expect(result).toBeUndefined();

      // No template UserProde exists, so no group predictions for a template UP.
      const allTemplateUPs = await prisma.userProde.findMany({
        where: { userId: user.id, template: true },
      });
      expect(allTemplateUPs).toHaveLength(0);
    },
    30_000
  );

  it(
    "round-trip: edit room match, sync, verify template; edit again, sync, verify updated (not double-created)",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp } = await seedBase();

      const match = makeMatch({ prodeId: prodeRow.id });
      await prisma.match.create({ data: match });

      // First save: goals 1-0.
      await prisma.prodeUserGroupMatch.create({
        data: makeGroupPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 1,
          goalsRight: 0,
        }),
      });

      await syncronizeTemplate(room, user);

      const afterFirst = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(afterFirst).toHaveLength(1);
      expect(afterFirst[0].goalsLeft).toBe(1);
      expect(afterFirst[0].goalsRight).toBe(0);

      // Second save: goals 3-2.
      await prisma.prodeUserGroupMatch.updateMany({
        where: { matchId: match.id, userProdeId: roomUp.id },
        data: { goalsLeft: 3, goalsRight: 2 },
      });

      await syncronizeTemplate(room, user);

      const afterSecond = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      // Must still be exactly 1 row (no double-create).
      expect(afterSecond).toHaveLength(1);
      expect(afterSecond[0].goalsLeft).toBe(3);
      expect(afterSecond[0].goalsRight).toBe(2);
    },
    30_000
  );
});

// ---------------------------------------------------------------------------
// syncronizeFinalsTemplate
// ---------------------------------------------------------------------------

describe("syncronizeFinalsTemplate", () => {
  it(
    "finals match with countries set and not in template → created in template with countryLeftId/countryRightId",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp, countryA, countryB } =
        await seedBaseWithCountries();

      // Match with countries set (the filter requires both non-null).
      const match = makeMatch({
        prodeId: prodeRow.id,
        stage: "FINALS",
        countryLeftId: countryA.id,
        countryRightId: countryB.id,
      });
      await prisma.match.create({ data: match });

      // Room prediction for that match.
      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      // Template has no finals predictions yet.
      expect(
        await prisma.prodeUserFinalsMatch.count({
          where: { userProdeId: templateUp.id },
        })
      ).toBe(0);

      await syncronizeFinalsTemplate(room, user);

      const rows = await prisma.prodeUserFinalsMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].matchId).toBe(match.id);
      expect(rows[0].goalsLeft).toBe(2);
      expect(rows[0].goalsRight).toBe(1);
      expect(rows[0].countryLeftId).toBe(countryA.id);
      expect(rows[0].countryRightId).toBe(countryB.id);
    },
    30_000
  );

  it(
    "finals match with countries set and exists in template → updated, including countryLeftId/countryRightId",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp, countryA, countryB } =
        await seedBaseWithCountries();

      const match = makeMatch({
        prodeId: prodeRow.id,
        stage: "FINALS",
        countryLeftId: countryA.id,
        countryRightId: countryB.id,
      });
      await prisma.match.create({ data: match });

      // Room prediction: 2-1.
      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      // Template already has a stale prediction for the same match.
      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: match.id,
          userProdeId: templateUp.id,
          goalsLeft: 0,
          goalsRight: 0,
          // Stale country IDs (same here for simplicity; the update must still overwrite).
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      await syncronizeFinalsTemplate(room, user);

      const rows = await prisma.prodeUserFinalsMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].goalsLeft).toBe(2);
      expect(rows[0].goalsRight).toBe(1);
      expect(rows[0].countryLeftId).toBe(countryA.id);
      expect(rows[0].countryRightId).toBe(countryB.id);
    },
    30_000
  );

  it(
    "finals match WITHOUT countries set in the match row → NOT synced to template",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp, countryA, countryB } =
        await seedBaseWithCountries();

      // Match without countries.
      const matchNoCountries = makeMatch({
        prodeId: prodeRow.id,
        stage: "FINALS",
        countryLeftId: null,
        countryRightId: null,
      });
      await prisma.match.create({ data: matchNoCountries });

      // A room-level UserProde finals prediction for this match requires non-null
      // countryLeftId / countryRightId because ProdeUserFinalsMatch has them NOT NULL.
      // We use real country IDs for the prediction row itself — the filter that matters
      // is on the Match row (countryLeftId / countryRightId must be non-null on the
      // MATCH, not the prediction).
      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: matchNoCountries.id,
          userProdeId: roomUp.id,
          goalsLeft: 1,
          goalsRight: 0,
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      await syncronizeFinalsTemplate(room, user);

      // The match had no countries on the Match row, so it must NOT appear in the template.
      const rows = await prisma.prodeUserFinalsMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(0);
    },
    30_000
  );

  it(
    "finals match with penaltisLeft/Right in the room prediction → penalty values copied to template",
    async () => {
      const { user, room, prodeRow, roomUp, templateUp, countryA, countryB } =
        await seedBaseWithCountries();

      const match = makeMatch({
        prodeId: prodeRow.id,
        stage: "FINALS",
        countryLeftId: countryA.id,
        countryRightId: countryB.id,
      });
      await prisma.match.create({ data: match });

      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 1,
          goalsRight: 1,
          penaltisLeft: 5,
          penaltisRight: 4,
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      await syncronizeFinalsTemplate(room, user);

      const rows = await prisma.prodeUserFinalsMatch.findMany({
        where: { userProdeId: templateUp.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].penaltisLeft).toBe(5);
      expect(rows[0].penaltisRight).toBe(4);
    },
    30_000
  );

  it(
    "user has no template UserProde → function returns early, no writes",
    async () => {
      const { user, room, prodeRow, roomUp, countryA, countryB } =
        await seedBaseWithCountries();

      // Remove the template UserProde.
      await prisma.userProde.deleteMany({
        where: { userId: user.id, template: true },
      });

      const match = makeMatch({
        prodeId: prodeRow.id,
        stage: "FINALS",
        countryLeftId: countryA.id,
        countryRightId: countryB.id,
      });
      await prisma.match.create({ data: match });
      await prisma.prodeUserFinalsMatch.create({
        data: makeFinalsPrediction({
          matchId: match.id,
          userProdeId: roomUp.id,
          goalsLeft: 2,
          goalsRight: 1,
          countryLeftId: countryA.id,
          countryRightId: countryB.id,
        }),
      });

      const result = await syncronizeFinalsTemplate(room, user);

      expect(result).toBeUndefined();

      const allTemplateUPs = await prisma.userProde.findMany({
        where: { userId: user.id, template: true },
      });
      expect(allTemplateUPs).toHaveLength(0);
    },
    30_000
  );
});
