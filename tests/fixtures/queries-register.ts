/**
 * Fixtures for registerUserToRoom tests (Phase 1D).
 *
 * All factories accept a PrismaClient and create rows, returning the created
 * record. IDs are caller-supplied strings so tests can reference them.
 */

import { PrismaClient, Stage } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// cleanDB
// ---------------------------------------------------------------------------

/**
 * Wipe tables in FK-safe reverse-dependency order so each test starts clean.
 * Uses raw TRUNCATE … CASCADE to avoid FK ordering issues when other test
 * suites (e.g. divergence.test.ts) share the same database.
 */
export async function cleanDB(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE
       "ProdeUserFinalsMatch",
       "ProdeUserGroupMatch",
       "UserProde",
       "Match",
       "ProdeRoom",
       "Prode",
       "Country",
       "Account",
       "Session",
       "User",
       "VerificationToken"
     CASCADE`
  );
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export async function makeUser(
  prisma: PrismaClient,
  id: string,
  email: string
) {
  return prisma.user.create({
    data: { id, email, name: id },
  });
}

export async function makeCountry(prisma: PrismaClient, id: string) {
  return prisma.country.upsert({
    where: { id },
    create: { id, code: id, name: `country-${id}` },
    update: {},
  });
}

export async function makeProde(prisma: PrismaClient, id: string) {
  const now = new Date("2026-06-01");
  return prisma.prode.create({
    data: {
      id,
      stage: "FINALS",
      created: now,
      groupSubmissionsEnd: now,
      finalsSubmissionsEnd: now,
      prodeEnd: now,
    },
  });
}

export async function makeProdeRoom(
  prisma: PrismaClient,
  opts: { id: string; prodeId: string; userId: string }
) {
  return prisma.prodeRoom.create({
    data: {
      id: opts.id,
      name: `room-${opts.id}`,
      public: true,
      created: new Date("2026-06-01"),
      userId: opts.userId,
      prodeId: opts.prodeId,
      pointsWinner: 1,
      pointsGoals: 3,
      pointsPenal: 5,
    },
  });
}

/**
 * Creates a template UserProde (prodeRoomId=null, template=true) for the
 * given user / prode.  Returns the created record.
 */
export async function makeTemplateUserProde(
  prisma: PrismaClient,
  opts: { id: string; prodeId: string; userId: string }
) {
  return prisma.userProde.create({
    data: {
      id: opts.id,
      prodeId: opts.prodeId,
      userId: opts.userId,
      template: true,
      prodeRoomId: null,
      created: new Date("2026-06-01"),
    },
  });
}

export async function makeMatch(
  prisma: PrismaClient,
  opts: {
    id: string;
    prodeId: string;
    stage: Stage;
    date: Date;
    countryLeftId?: string | null;
    countryRightId?: string | null;
    goalsLeft?: number | null;
    goalsRight?: number | null;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
    filled?: boolean;
  }
) {
  return prisma.match.create({
    data: {
      id: opts.id,
      prodeId: opts.prodeId,
      stage: opts.stage,
      date: opts.date,
      countryLeftId: opts.countryLeftId ?? null,
      countryRightId: opts.countryRightId ?? null,
      goalsLeft: opts.goalsLeft ?? null,
      goalsRight: opts.goalsRight ?? null,
      penaltisLeft: opts.penaltisLeft ?? null,
      penaltisRight: opts.penaltisRight ?? null,
      filled: opts.filled ?? false,
    },
  });
}

export async function makeGroupPrediction(
  prisma: PrismaClient,
  opts: {
    userProdeId: string;
    matchId: string;
    goalsLeft: number;
    goalsRight: number;
  }
) {
  return prisma.prodeUserGroupMatch.create({
    data: {
      userProdeId: opts.userProdeId,
      matchId: opts.matchId,
      goalsLeft: opts.goalsLeft,
      goalsRight: opts.goalsRight,
    },
  });
}

export async function makeFinalsPrediction(
  prisma: PrismaClient,
  opts: {
    userProdeId: string;
    matchId: string;
    goalsLeft: number;
    goalsRight: number;
    countryLeftId: string;
    countryRightId: string;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }
) {
  return prisma.prodeUserFinalsMatch.create({
    data: {
      userProdeId: opts.userProdeId,
      matchId: opts.matchId,
      goalsLeft: opts.goalsLeft,
      goalsRight: opts.goalsRight,
      countryLeftId: opts.countryLeftId,
      countryRightId: opts.countryRightId,
      penaltisLeft: opts.penaltisLeft ?? null,
      penaltisRight: opts.penaltisRight ?? null,
    },
  });
}
