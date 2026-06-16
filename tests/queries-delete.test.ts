/**
 * Phase 1D — deleteUserProde characterisation tests.
 *
 * deleteUserProde is now a SOFT delete: it stamps UserProde.deletedAt and leaves
 * the prediction rows (ProdeUserGroupMatch / ProdeUserFinalsMatch) intact so a
 * later re-join can reactivate the membership and restore the predictions. Read
 * paths exclude soft-deleted UserProdes via `deletedAt: null`, so the preserved
 * predictions never leak into rankings or member counts.
 *
 * Each test seeds a scenario, calls deleteUserProde, then asserts DB state via
 * Prisma .count() / .findFirst() calls.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from '@/generated/prisma';

import { deleteUserProde } from "@/utils/queries";
import {
  cleanDB,
  makeUser,
  makeCountry,
  makeProde,
  makeProdeRoom,
  makeUserProde,
  makeMatch,
  makeGroupPrediction,
  makeFinalsPrediction,
} from "@test/fixtures/queries-delete";

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
  // Sanity-check: throws if DB is unreachable, which correctly fails the suite.
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

/** Seed the minimal graph: Prode + ProdeRoom + User (no predictions yet). */
async function seedBase(tag: string) {
  const prodeId = `prode-del-${tag}`;
  const userId = `user-del-${tag}`;
  const roomId = `room-del-${tag}`;

  await makeProde(prisma, prodeId);
  await makeUser(prisma, userId, `${userId}@test.local`);
  await makeProdeRoom(prisma, { id: roomId, prodeId, userId });

  return { prodeId, userId, roomId };
}

/** Seed a UserProde with one group prediction and one finals prediction. */
async function seedUserProdeWithPredictions(
  tag: string,
  base: { prodeId: string; userId: string; roomId: string }
) {
  const upId = `up-del-${tag}`;
  const matchGroupId = `match-grp-del-${tag}`;
  const matchFinalsId = `match-fin-del-${tag}`;

  // Two countries needed for ProdeUserFinalsMatch FKs
  await makeCountry(prisma, `CTL-${tag}`);
  await makeCountry(prisma, `CTR-${tag}`);

  const now = new Date("2026-06-01");

  await makeMatch(prisma, {
    id: matchGroupId,
    prodeId: base.prodeId,
    stage: "GROUP_A",
    date: now,
    countryLeftId: `CTL-${tag}`,
    countryRightId: `CTR-${tag}`,
    goalsLeft: 1,
    goalsRight: 0,
    filled: true,
  });

  await makeMatch(prisma, {
    id: matchFinalsId,
    prodeId: base.prodeId,
    stage: "FINALS",
    date: now,
    countryLeftId: `CTL-${tag}`,
    countryRightId: `CTR-${tag}`,
    goalsLeft: 2,
    goalsRight: 1,
    filled: true,
  });

  await makeUserProde(prisma, {
    id: upId,
    prodeId: base.prodeId,
    userId: base.userId,
    prodeRoomId: base.roomId,
  });

  await makeGroupPrediction(prisma, {
    userProdeId: upId,
    matchId: matchGroupId,
    goalsLeft: 1,
    goalsRight: 0,
  });

  await makeFinalsPrediction(prisma, {
    userProdeId: upId,
    matchId: matchFinalsId,
    goalsLeft: 2,
    goalsRight: 1,
    countryLeftId: `CTL-${tag}`,
    countryRightId: `CTR-${tag}`,
  });

  return { upId, matchGroupId, matchFinalsId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deleteUserProde", () => {
  it("preserves all ProdeUserGroupMatch rows belonging to the given userProde (soft delete)", async () => {
    const base = await seedBase("grp");
    const { upId } = await seedUserProdeWithPredictions("grp", base);

    // Confirm predictions exist before deletion
    const beforeCount = await prisma.prodeUserGroupMatch.count({
      where: { userProdeId: upId },
    });
    expect(beforeCount).toBe(1);

    await deleteUserProde(upId);

    // Soft delete leaves prediction rows untouched so a re-join can restore them.
    const afterCount = await prisma.prodeUserGroupMatch.count({
      where: { userProdeId: upId },
    });
    expect(afterCount).toBe(1);
  });

  it("preserves all ProdeUserFinalsMatch rows belonging to the given userProde (soft delete)", async () => {
    const base = await seedBase("fin");
    const { upId } = await seedUserProdeWithPredictions("fin", base);

    const beforeCount = await prisma.prodeUserFinalsMatch.count({
      where: { userProdeId: upId },
    });
    expect(beforeCount).toBe(1);

    await deleteUserProde(upId);

    const afterCount = await prisma.prodeUserFinalsMatch.count({
      where: { userProdeId: upId },
    });
    expect(afterCount).toBe(1);
  });

  it("soft-deletes the UserProde row: it survives but gets a deletedAt stamp", async () => {
    const base = await seedBase("up");
    const { upId } = await seedUserProdeWithPredictions("up", base);

    const before = await prisma.userProde.findFirst({ where: { id: upId } });
    expect(before).not.toBeNull();
    expect(before!.deletedAt).toBeNull();

    await deleteUserProde(upId);

    // The row still exists (recoverable) but is now marked deleted.
    const after = await prisma.userProde.findFirst({ where: { id: upId } });
    expect(after).not.toBeNull();
    expect(after!.deletedAt).not.toBeNull();

    // It no longer counts as an active member.
    const activeCount = await prisma.userProde.count({
      where: { id: upId, deletedAt: null },
    });
    expect(activeCount).toBe(0);
  });

  it("does not touch another user's rows when one userProde is soft-deleted", async () => {
    // Seed two separate users, each with their own UserProde and predictions.
    const prodeId = "prode-del-isolation";
    const userId1 = "user-del-iso-1";
    const userId2 = "user-del-iso-2";
    const roomId1 = "room-del-iso-1";
    const roomId2 = "room-del-iso-2";

    await makeProde(prisma, prodeId);
    await makeUser(prisma, userId1, "iso1@test.local");
    await makeUser(prisma, userId2, "iso2@test.local");
    await makeProdeRoom(prisma, { id: roomId1, prodeId, userId: userId1 });
    await makeProdeRoom(prisma, { id: roomId2, prodeId, userId: userId2 });

    const base1 = { prodeId, userId: userId1, roomId: roomId1 };
    const base2 = { prodeId, userId: userId2, roomId: roomId2 };

    const { upId: upId1 } = await seedUserProdeWithPredictions("iso1", base1);
    const { upId: upId2 } = await seedUserProdeWithPredictions("iso2", base2);

    // Soft-delete only the first user's prode
    await deleteUserProde(upId1);

    // First user's row survives but is marked deleted; predictions preserved.
    const up1 = await prisma.userProde.findFirst({ where: { id: upId1 } });
    expect(up1).not.toBeNull();
    expect(up1!.deletedAt).not.toBeNull();
    expect(
      await prisma.prodeUserGroupMatch.count({ where: { userProdeId: upId1 } })
    ).toBe(1);
    expect(
      await prisma.prodeUserFinalsMatch.count({ where: { userProdeId: upId1 } })
    ).toBe(1);

    // Second user's row is untouched and still active.
    const up2 = await prisma.userProde.findFirst({ where: { id: upId2 } });
    expect(up2).not.toBeNull();
    expect(up2!.deletedAt).toBeNull();
    expect(
      await prisma.prodeUserGroupMatch.count({ where: { userProdeId: upId2 } })
    ).toBe(1);
    expect(
      await prisma.prodeUserFinalsMatch.count({ where: { userProdeId: upId2 } })
    ).toBe(1);
  });

  it("is idempotent / harmless when called with a non-existent ID — does not throw", async () => {
    // No seed — call directly with a fabricated ID that has never existed.
    const ghostId = "non-existent-userprode-id-9999";

    // updateMany on a non-matching where clause is a no-op in Prisma/Postgres;
    // the function should complete without throwing.
    await expect(deleteUserProde(ghostId)).resolves.toBeUndefined();

    // Confirm no side-effects: all prediction tables remain empty.
    expect(await prisma.prodeUserGroupMatch.count()).toBe(0);
    expect(await prisma.prodeUserFinalsMatch.count()).toBe(0);
    expect(await prisma.userProde.count()).toBe(0);
  });
});
