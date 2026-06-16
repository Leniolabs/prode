/**
 * Phase 1D — registerUserToRoom characterization tests.
 *
 * Each test seeds a specific scenario, calls registerUserToRoom, and asserts
 * the observable DB state plus the return value.
 *
 * Reuses the DB connection / seed / cleanup pattern from
 * tests/sql/divergence.test.ts.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from '@/generated/prisma';

import { deleteUserProde, registerUserToRoom } from "@/utils/queries";
import {
  cleanDB,
  makeCountry,
  makeFinalsPrediction,
  makeGroupPrediction,
  makeMatch,
  makeProde,
  makeProdeRoom,
  makeTemplateUserProde,
  makeUser,
} from "@test/fixtures/queries-register";

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://leniolabs:leniolabs@localhost:5433/prode_test";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

beforeAll(async () => {
  // Sanity-check DB reachability; throws and fails fast if unreachable.
  await prisma.$queryRaw`SELECT 1`;
}, 30_000);

beforeEach(async () => {
  await cleanDB(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Shared IDs (re-used across tests; each test gets a clean DB via beforeEach)
// ---------------------------------------------------------------------------

const PRODE_ID = "prode-reg-1";
const ROOM_ID = "room-reg-1";
const USER_ID = "user-reg-1";
const USER2_ID = "user-reg-2";
const TEMPLATE_UP_ID = "up-template-1";

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days
const PAST = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // -7 days

const MATCH_GROUP_FUTURE = "match-group-future";
const MATCH_GROUP_PAST = "match-group-past";
const MATCH_FINALS_FUTURE = "match-finals-future";
const MATCH_FINALS_FUTURE_NO_COUNTRIES = "match-finals-future-no-countries";
const MATCH_FINALS_PENALTIES = "match-finals-penalties";

const COUNTRY_A = "CTR_A";
const COUNTRY_B = "CTR_B";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("registerUserToRoom", () => {
  // -------------------------------------------------------------------------
  // Scenario 1: First-time join, no template UserProde
  // -------------------------------------------------------------------------

  it(
    "creates a UserProde for the user in the room when no template exists",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;

      const result = await registerUserToRoom(room, user);

      expect(result).toBeDefined();
      expect(result!.prodeRoomId).toBe(ROOM_ID);
      expect(result!.userId).toBe(USER_ID);
      expect(result!.prodeId).toBe(PRODE_ID);

      const upCount = await prisma.userProde.count({
        where: { prodeRoomId: ROOM_ID, userId: USER_ID },
      });
      expect(upCount).toBe(1);

      // No predictions copied because there's no template.
      const groupCount = await prisma.prodeUserGroupMatch.count({
        where: { userProde: { prodeRoomId: ROOM_ID } },
      });
      expect(groupCount).toBe(0);

      const finalsCount = await prisma.prodeUserFinalsMatch.count({
        where: { userProde: { prodeRoomId: ROOM_ID } },
      });
      expect(finalsCount).toBe(0);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 2: First-time join with future group predictions in template
  // -------------------------------------------------------------------------

  it(
    "copies future-dated template group predictions into the new UserProde",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      // Future group match with a template prediction.
      await makeMatch(prisma, {
        id: MATCH_GROUP_FUTURE,
        prodeId: PRODE_ID,
        stage: "GROUP_A",
        date: FUTURE,
      });
      await makeGroupPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_GROUP_FUTURE,
        goalsLeft: 2,
        goalsRight: 1,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      const result = await registerUserToRoom(room, user);

      expect(result).toBeDefined();

      const copied = await prisma.prodeUserGroupMatch.findFirst({
        where: { userProde: { prodeRoomId: ROOM_ID }, matchId: MATCH_GROUP_FUTURE },
      });
      expect(copied).not.toBeNull();
      expect(copied!.goalsLeft).toBe(2);
      expect(copied!.goalsRight).toBe(1);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 3: Template has past-dated group predictions — NOT copied
  // -------------------------------------------------------------------------

  it(
    "does not copy past-dated template group predictions",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      await makeMatch(prisma, {
        id: MATCH_GROUP_PAST,
        prodeId: PRODE_ID,
        stage: "GROUP_A",
        date: PAST,
      });
      await makeGroupPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_GROUP_PAST,
        goalsLeft: 1,
        goalsRight: 0,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      await registerUserToRoom(room, user);

      const groupCount = await prisma.prodeUserGroupMatch.count({
        where: { userProde: { prodeRoomId: ROOM_ID } },
      });
      expect(groupCount).toBe(0);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 4: Template group predictions with missing goals — NOT copied
  // -------------------------------------------------------------------------

  it(
    "does not copy future-dated template group predictions that have null/0 goals (pinned current behavior, may be a bug: goalsLeft=0 is treated as falsy and skipped)",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      // goalsLeft = 0 — treated as falsy in the filter, so it won't be copied.
      await makeMatch(prisma, {
        id: MATCH_GROUP_FUTURE,
        prodeId: PRODE_ID,
        stage: "GROUP_A",
        date: FUTURE,
      });
      await makeGroupPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_GROUP_FUTURE,
        goalsLeft: 0,
        goalsRight: 1,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      await registerUserToRoom(room, user);

      const groupCount = await prisma.prodeUserGroupMatch.count({
        where: { userProde: { prodeRoomId: ROOM_ID } },
      });
      expect(groupCount).toBe(0);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 5: Template has future finals predictions with all required
  // fields → copied
  // -------------------------------------------------------------------------

  it(
    "copies future finals template predictions that have goals and countries",
    async () => {
      await makeCountry(prisma, COUNTRY_A);
      await makeCountry(prisma, COUNTRY_B);
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      // Future finals match WITH countries on the match itself (the function
      // reads userCountryLeftId from match.countryLeftId).
      await makeMatch(prisma, {
        id: MATCH_FINALS_FUTURE,
        prodeId: PRODE_ID,
        stage: "FINALS",
        date: FUTURE,
        countryLeftId: COUNTRY_A,
        countryRightId: COUNTRY_B,
      });
      await makeFinalsPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_FINALS_FUTURE,
        goalsLeft: 2,
        goalsRight: 1,
        countryLeftId: COUNTRY_A,
        countryRightId: COUNTRY_B,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      const result = await registerUserToRoom(room, user);

      expect(result).toBeDefined();

      const copied = await prisma.prodeUserFinalsMatch.findFirst({
        where: { userProde: { prodeRoomId: ROOM_ID }, matchId: MATCH_FINALS_FUTURE },
      });
      expect(copied).not.toBeNull();
      expect(copied!.goalsLeft).toBe(2);
      expect(copied!.goalsRight).toBe(1);
      expect(copied!.countryLeftId).toBe(COUNTRY_A);
      expect(copied!.countryRightId).toBe(COUNTRY_B);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 6: Template has finals predictions but match has no countries →
  // NOT copied
  //
  // pinned current behavior, may be a bug: the filter checks
  // match.countryLeftId (the match entity field), not the prediction's
  // countryLeftId. If the match row has no countries, no finals prediction
  // is ever copied regardless of what the user predicted.
  // -------------------------------------------------------------------------

  it(
    "pinned current behavior, may be a bug: does not copy future finals predictions when the match has no country IDs set (filter reads match.countryLeftId, not prediction.countryLeftId)",
    async () => {
      await makeCountry(prisma, COUNTRY_A);
      await makeCountry(prisma, COUNTRY_B);
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      // Match has NO countryLeftId / countryRightId set.
      await makeMatch(prisma, {
        id: MATCH_FINALS_FUTURE_NO_COUNTRIES,
        prodeId: PRODE_ID,
        stage: "FINALS",
        date: FUTURE,
        countryLeftId: null,
        countryRightId: null,
      });
      await makeFinalsPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_FINALS_FUTURE_NO_COUNTRIES,
        goalsLeft: 1,
        goalsRight: 0,
        countryLeftId: COUNTRY_A,
        countryRightId: COUNTRY_B,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      await registerUserToRoom(room, user);

      const finalsCount = await prisma.prodeUserFinalsMatch.count({
        where: { userProde: { prodeRoomId: ROOM_ID } },
      });
      expect(finalsCount).toBe(0);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 7: Template has finals predictions with penalty values → carried
  // over
  // -------------------------------------------------------------------------

  it(
    "carries over penalty values from template finals predictions",
    async () => {
      await makeCountry(prisma, COUNTRY_A);
      await makeCountry(prisma, COUNTRY_B);
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const templateUp = await makeTemplateUserProde(prisma, {
        id: TEMPLATE_UP_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });

      await makeMatch(prisma, {
        id: MATCH_FINALS_PENALTIES,
        prodeId: PRODE_ID,
        stage: "FINALS",
        date: FUTURE,
        countryLeftId: COUNTRY_A,
        countryRightId: COUNTRY_B,
      });
      await makeFinalsPrediction(prisma, {
        userProdeId: templateUp.id,
        matchId: MATCH_FINALS_PENALTIES,
        goalsLeft: 1,
        goalsRight: 1,
        countryLeftId: COUNTRY_A,
        countryRightId: COUNTRY_B,
        penaltisLeft: 4,
        penaltisRight: 3,
      });

      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;
      await registerUserToRoom(room, user);

      const copied = await prisma.prodeUserFinalsMatch.findFirst({
        where: { userProde: { prodeRoomId: ROOM_ID }, matchId: MATCH_FINALS_PENALTIES },
      });
      expect(copied).not.toBeNull();
      expect(copied!.penaltisLeft).toBe(4);
      expect(copied!.penaltisRight).toBe(3);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 8: Already-registered user → no double-create, returns undefined
  // -------------------------------------------------------------------------

  it(
    "returns undefined and creates no extra rows when the user is already registered to the room",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;

      // First registration.
      await registerUserToRoom(room, user);

      const countBefore = await prisma.userProde.count({
        where: { prodeRoomId: ROOM_ID, userId: USER_ID },
      });
      expect(countBefore).toBe(1);

      // Second call — should be a no-op.
      const second = await registerUserToRoom(room, user);
      expect(second).toBeUndefined();

      const countAfter = await prisma.userProde.count({
        where: { prodeRoomId: ROOM_ID, userId: USER_ID },
      });
      expect(countAfter).toBe(1);
    },
    30_000
  );

  // -------------------------------------------------------------------------
  // Scenario 9: Re-joining a room after leaving reactivates the soft-deleted
  // UserProde (same row, deletedAt cleared) and preserves its predictions.
  // -------------------------------------------------------------------------

  it(
    "reactivates a soft-deleted UserProde on re-join instead of creating a new row, preserving predictions",
    async () => {
      await makeProde(prisma, PRODE_ID);
      await makeUser(prisma, USER_ID, "user1@test.local");
      const room = await makeProdeRoom(prisma, {
        id: ROOM_ID,
        prodeId: PRODE_ID,
        userId: USER_ID,
      });
      const user = (await prisma.user.findUniqueOrThrow({
        where: { id: USER_ID },
      })) as any;

      // First join.
      const first = await registerUserToRoom(room, user);
      expect(first).toBeDefined();
      const originalId = first!.id;

      // Seed a prediction so we can prove it survives the leave/rejoin cycle.
      await makeMatch(prisma, {
        id: MATCH_GROUP_FUTURE,
        prodeId: PRODE_ID,
        stage: "GROUP_A",
        date: FUTURE,
      });
      await makeGroupPrediction(prisma, {
        userProdeId: originalId,
        matchId: MATCH_GROUP_FUTURE,
        goalsLeft: 3,
        goalsRight: 2,
      });

      // Leave (soft delete).
      await deleteUserProde(originalId);
      const afterLeave = await prisma.userProde.findUniqueOrThrow({
        where: { id: originalId },
      });
      expect(afterLeave.deletedAt).not.toBeNull();

      // Re-join: should reactivate the same row, not create a second one.
      await registerUserToRoom(room, user);

      const rows = await prisma.userProde.findMany({
        where: { prodeRoomId: ROOM_ID, userId: USER_ID },
      });
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(originalId);
      expect(rows[0].deletedAt).toBeNull();

      // The original prediction is still attached (not duplicated, not lost).
      const predictions = await prisma.prodeUserGroupMatch.findMany({
        where: { userProdeId: originalId },
      });
      expect(predictions.length).toBe(1);
      expect(predictions[0].goalsLeft).toBe(3);
      expect(predictions[0].goalsRight).toBe(2);
    },
    30_000
  );
});
