/**
 * Fixtures for deleteUserProde tests (Phase 1D).
 *
 * Re-exports the shared factories from queries-register so both fixture files
 * stay in sync. Also exports a makeUserProde factory (room-linked, non-template)
 * that deleteUserProde tests need, and cleanDB in FK-safe order.
 */

import { PrismaClient, Stage } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Re-export shared factories so callers only need one import
// ---------------------------------------------------------------------------

export {
  makeUser,
  makeCountry,
  makeProde,
  makeProdeRoom,
  makeMatch,
  makeGroupPrediction,
  makeFinalsPrediction,
} from "@test/fixtures/queries-register";

// ---------------------------------------------------------------------------
// cleanDB
// ---------------------------------------------------------------------------

/**
 * Wipe all tables in FK-safe reverse-dependency order so each test starts clean.
 */
export async function cleanDB(prisma: PrismaClient) {
  await prisma.prodeUserFinalsMatch.deleteMany({});
  await prisma.prodeUserGroupMatch.deleteMany({});
  await prisma.userProde.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.prodeRoom.deleteMany({});
  await prisma.prode.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}

// ---------------------------------------------------------------------------
// makeUserProde — room-linked, non-template
// ---------------------------------------------------------------------------

/**
 * Creates a normal (room-linked, non-template) UserProde row.
 */
export async function makeUserProde(
  prisma: PrismaClient,
  opts: { id: string; prodeId: string; userId: string; prodeRoomId: string }
) {
  return prisma.userProde.create({
    data: {
      id: opts.id,
      prodeId: opts.prodeId,
      userId: opts.userId,
      prodeRoomId: opts.prodeRoomId,
      template: false,
      created: new Date("2026-06-01"),
    },
  });
}
