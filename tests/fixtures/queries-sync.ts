/**
 * Fixtures and helpers for tests/queries-sync.test.ts.
 *
 * Covers: syncronizeTemplate and syncronizeFinalsTemplate in utils/queries.ts.
 */

import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// ID factories — deterministic prefixes avoid collisions with other agents'
// test data.
// ---------------------------------------------------------------------------

let counter = 0;

function uid(prefix: string): string {
  return `${prefix}-qs-${++counter}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Typed factories
// ---------------------------------------------------------------------------

export function makeUser(overrides: { id?: string; email?: string } = {}) {
  const id = overrides.id ?? uid("user");
  return {
    id,
    email: overrides.email ?? `${id}@test.local`,
    name: id,
  };
}

export function makeCountry(code: string) {
  // ID must contain QS_MARKER ("-qs-") so cleanDB can scope its deletes.
  return {
    id: `country-${code}-qs-fix`,
    code,
    name: `Country-${code}-qs-fix`,
  };
}

export function makeProde(overrides: { id?: string } = {}) {
  const now = new Date("2026-06-01");
  return {
    id: overrides.id ?? uid("prode"),
    stage: "FINALS" as const,
    created: now,
    groupSubmissionsEnd: now,
    finalsSubmissionsEnd: now,
    prodeEnd: now,
  };
}

export function makeProdeRoom(
  overrides: {
    id?: string;
    name?: string;
    userId: string;
    prodeId: string;
  }
) {
  return {
    id: overrides.id ?? uid("room"),
    name: overrides.name ?? uid("room-name"),
    public: true,
    created: new Date("2026-06-01"),
    userId: overrides.userId,
    prodeId: overrides.prodeId,
    pointsWinner: 1,
    pointsGoals: 3,
    pointsPenal: 5,
  };
}

export function makeMatch(overrides: {
  id?: string;
  prodeId: string;
  stage?: "GROUP_A" | "FINALS" | "FINALS_8_1";
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string | null;
  countryRightId?: string | null;
}) {
  return {
    id: overrides.id ?? uid("match"),
    date: new Date("2026-06-01"),
    stage: (overrides.stage ?? "GROUP_A") as "GROUP_A",
    goalsLeft: overrides.goalsLeft ?? null,
    goalsRight: overrides.goalsRight ?? null,
    penaltisLeft: null as number | null,
    penaltisRight: null as number | null,
    filled: false,
    countryLeftId: overrides.countryLeftId ?? null,
    countryRightId: overrides.countryRightId ?? null,
    prodeId: overrides.prodeId,
  };
}

export function makeTemplateUserProde(overrides: {
  id?: string;
  userId: string;
  prodeId: string;
}) {
  return {
    id: overrides.id ?? uid("tup"),
    created: new Date("2026-06-01"),
    template: true,
    prodeRoomId: null,
    userId: overrides.userId,
    prodeId: overrides.prodeId,
  };
}

export function makeRoomUserProde(overrides: {
  id?: string;
  userId: string;
  prodeId: string;
  prodeRoomId: string;
}) {
  return {
    id: overrides.id ?? uid("rup"),
    created: new Date("2026-06-01"),
    template: false,
    prodeRoomId: overrides.prodeRoomId,
    userId: overrides.userId,
    prodeId: overrides.prodeId,
  };
}

export function makeGroupPrediction(overrides: {
  matchId: string;
  userProdeId: string;
  goalsLeft?: number;
  goalsRight?: number;
}) {
  return {
    matchId: overrides.matchId,
    userProdeId: overrides.userProdeId,
    goalsLeft: overrides.goalsLeft ?? 1,
    goalsRight: overrides.goalsRight ?? 0,
  };
}

export function makeFinalsPrediction(overrides: {
  matchId: string;
  userProdeId: string;
  goalsLeft?: number;
  goalsRight?: number;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
  countryLeftId: string;
  countryRightId: string;
}) {
  return {
    matchId: overrides.matchId,
    userProdeId: overrides.userProdeId,
    goalsLeft: overrides.goalsLeft ?? 1,
    goalsRight: overrides.goalsRight ?? 0,
    penaltisLeft: overrides.penaltisLeft ?? null,
    penaltisRight: overrides.penaltisRight ?? null,
    countryLeftId: overrides.countryLeftId,
    countryRightId: overrides.countryRightId,
  };
}

// ---------------------------------------------------------------------------
// DB cleanup — call before each test in FK-safe order.
//
// We scope deletes to rows whose IDs contain our marker so we do not wipe
// records created by divergence.test.ts or any other concurrently-running
// test file (vitest runs files in parallel workers sharing the same DB).
// ---------------------------------------------------------------------------

/** Marker suffix embedded in every ID produced by this fixture module. */
export const QS_MARKER = "-qs-";

export async function cleanDB(prisma: PrismaClient) {
  // Delete in FK-safe order.  We filter to rows whose IDs contain QS_MARKER
  // so we don't disturb records owned by other test files.

  // ProdeUserFinalsMatch / ProdeUserGroupMatch: filter via userProde relation.
  // Easiest: delete all where userProdeId contains the marker.
  await prisma.prodeUserFinalsMatch.deleteMany({
    where: { userProdeId: { contains: QS_MARKER } },
  });
  await prisma.prodeUserGroupMatch.deleteMany({
    where: { userProdeId: { contains: QS_MARKER } },
  });

  // Also wipe any that are linked to our matches (in case userProdeId doesn't
  // contain the marker but matchId does).
  await prisma.prodeUserFinalsMatch.deleteMany({
    where: { matchId: { contains: QS_MARKER } },
  });
  await prisma.prodeUserGroupMatch.deleteMany({
    where: { matchId: { contains: QS_MARKER } },
  });

  await prisma.userProde.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
  await prisma.match.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
  await prisma.prodeRoom.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
  await prisma.prode.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
  await prisma.country.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
  await prisma.user.deleteMany({
    where: { id: { contains: QS_MARKER } },
  });
}
