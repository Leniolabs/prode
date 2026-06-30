// Seed helper for histogram testing.
//
// It ensures the WC 2026 tournament is fully played, then creates a batch of
// users with different scoring profiles in the Harness Room so the ranking
// histograms show a real spread.

import { loadHarnessEnv } from "../../harness/env";
import type { PrismaClient } from "@/generated/prisma";

const GROUP_STAGES = [
  "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D",
  "GROUP_E", "GROUP_F", "GROUP_G", "GROUP_H",
  "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
] as const;

const BRACKET_ORDER = [
  ...Array.from({ length: 16 }, (_, i) => `FINALS_16_${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `FINALS_8_${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `FINALS_4_${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `FINALS_2_${i + 1}`),
  "FINALS",
  "THIRD_PLACE",
];

type Tier = {
  name: string;
  group: { exact: number; winner: number; wrong: number };
  finals: { exact: number; winner: number; wrong: number };
};

const TIERS: Tier[] = [
  {
    name: "low",
    group: { exact: 0.05, winner: 0.15, wrong: 0.80 },
    finals: { exact: 0.03, winner: 0.12, wrong: 0.85 },
  },
  {
    name: "medium",
    group: { exact: 0.15, winner: 0.50, wrong: 0.35 },
    finals: { exact: 0.12, winner: 0.48, wrong: 0.40 },
  },
  {
    name: "high",
    group: { exact: 0.35, winner: 0.50, wrong: 0.15 },
    finals: { exact: 0.30, winner: 0.55, wrong: 0.15 },
  },
  {
    name: "elite",
    group: { exact: 0.55, winner: 0.35, wrong: 0.10 },
    finals: { exact: 0.45, winner: 0.40, wrong: 0.15 },
  },
];

type ActualMatch = {
  goalsLeft: number;
  goalsRight: number;
  penaltisLeft: number | null;
  penaltisRight: number | null;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOutcome(rng: () => number, weights: { exact: number; winner: number; wrong: number }) {
  const roll = rng();
  if (roll < weights.exact) return "EXACT" as const;
  if (roll < weights.exact + weights.winner) return "WINNER" as const;
  return "WRONG" as const;
}

function actualResult(i: number): ActualMatch {
  if (i % 12 === 5) {
    return { goalsLeft: 1, goalsRight: 1, penaltisLeft: 4, penaltisRight: 2 };
  }
  return i % 2 === 0
    ? { goalsLeft: 2, goalsRight: 1, penaltisLeft: null, penaltisRight: null }
    : { goalsLeft: 0, goalsRight: 2, penaltisLeft: null, penaltisRight: null };
}

function makeGroupPrediction(actual: ActualMatch, outcome: "EXACT" | "WINNER" | "WRONG") {
  if (outcome === "EXACT") {
    return actual;
  }

  const leftWins = actual.goalsLeft > actual.goalsRight;
  const rightWins = actual.goalsLeft < actual.goalsRight;

  if (outcome === "WINNER") {
    if (leftWins) return { goalsLeft: actual.goalsLeft + 1, goalsRight: actual.goalsRight, penaltisLeft: null, penaltisRight: null };
    if (rightWins) return { goalsLeft: actual.goalsLeft, goalsRight: actual.goalsRight + 1, penaltisLeft: null, penaltisRight: null };
    return { goalsLeft: 0, goalsRight: 0, penaltisLeft: null, penaltisRight: null };
  }

  if (actual.goalsLeft === actual.goalsRight) {
    return { goalsLeft: 2, goalsRight: 0, penaltisLeft: null, penaltisRight: null };
  }

  if (leftWins) return { goalsLeft: 0, goalsRight: 3, penaltisLeft: null, penaltisRight: null };
  return { goalsLeft: 3, goalsRight: 0, penaltisLeft: null, penaltisRight: null };
}

function makeFinalPrediction(actual: ActualMatch, outcome: "EXACT" | "WINNER" | "WRONG") {
  if (outcome === "EXACT") {
    return actual;
  }

  const draw = actual.goalsLeft === actual.goalsRight;
  const leftWins = actual.goalsLeft > actual.goalsRight;
  const rightWins = actual.goalsLeft < actual.goalsRight;

  if (outcome === "WINNER") {
    if (draw) {
      return {
        goalsLeft: actual.goalsLeft,
        goalsRight: actual.goalsRight,
        penaltisLeft: (actual.penaltisLeft ?? 4) + 1,
        penaltisRight: actual.penaltisRight ?? 2,
      };
    }

    if (leftWins) {
      return {
        goalsLeft: actual.goalsLeft + 1,
        goalsRight: actual.goalsRight,
        penaltisLeft: null,
        penaltisRight: null,
      };
    }

    return {
      goalsLeft: actual.goalsLeft,
      goalsRight: actual.goalsRight + 1,
      penaltisLeft: null,
      penaltisRight: null,
    };
  }

  if (draw) {
    return {
      goalsLeft: actual.goalsLeft,
      goalsRight: actual.goalsRight,
      penaltisLeft: (actual.penaltisLeft ?? 4) - 2,
      penaltisRight: (actual.penaltisRight ?? 2) + 1,
    };
  }

  if (leftWins) {
    return {
      goalsLeft: actual.goalsLeft - 1,
      goalsRight: actual.goalsRight + 1,
      penaltisLeft: null,
      penaltisRight: null,
    };
  }

  return {
    goalsLeft: actual.goalsLeft + 1,
    goalsRight: actual.goalsRight - 1,
    penaltisLeft: null,
    penaltisRight: null,
  };
}

function parseCount(argv: string[]) {
  const valueIndex = argv.indexOf("--count");
  if (valueIndex === -1) return 24;
  const raw = argv[valueIndex + 1];
  const parsed = parseInt(raw ?? "24", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

async function ensureTournament(prisma: PrismaClient) {
  const { seedCountries } = await import("./countries");
  const { seedFixture } = await import("./fixture");
  const { seedBracket } = await import("./bracket");
  const { getAdminFinalsMatchWinner, getAdminFinalsMatchLooser } = await import("@/lib/scoring");
  const { resolveFinalsMatches } = await import("@/utils/finals");

  await seedCountries(prisma);
  const prode = await prisma.prode.upsert({
    where: { id: "wc2026" },
    create: {
      id: "wc2026",
      stage: "FINALS",
      created: new Date(),
      groupSubmissionsEnd: new Date("2026-06-11T19:00:00.000Z"),
      finalsSubmissionsEnd: new Date("2026-06-28T19:00:00.000Z"),
      prodeEnd: new Date("2026-07-19T19:00:00.000Z"),
    },
    update: { stage: "FINALS" },
  });

  await prisma.prodeUserGroupMatch.deleteMany({
    where: { match: { prodeId: prode.id } },
  });
  await prisma.prodeUserFinalsMatch.deleteMany({
    where: { match: { prodeId: prode.id } },
  });

  await seedFixture(prisma, prode.id);
  await seedBracket(prisma, prode.id);

  const groupMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: GROUP_STAGES as never } },
    orderBy: { date: "asc" },
  });
  for (let i = 0; i < groupMatches.length; i++) {
    const r = actualResult(i);
    await prisma.match.update({
      where: { id: groupMatches[i].id },
      data: { goalsLeft: r.goalsLeft, goalsRight: r.goalsRight, filled: true },
    });
  }

  const countries = await prisma.country.findMany({ orderBy: { code: "asc" }, take: 32 });
  const bracketMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: BRACKET_ORDER as never } },
  });
  const byStage = new Map(bracketMatches.map((m) => [m.stage as string, m]));

  const resultByStage = new Map<string, ActualMatch>();
  BRACKET_ORDER.forEach((stage, i) => {
    if (byStage.get(stage)) resultByStage.set(stage, actualResult(i));
  });

  const r32CountryByStage = new Map<string, { left: string; right: string }>();
  for (let n = 1; n <= 16; n++) {
    const stage = `FINALS_16_${n}`;
    if (!byStage.get(stage)) continue;
    r32CountryByStage.set(stage, {
      left: countries[(n - 1) * 2].id,
      right: countries[(n - 1) * 2 + 1].id,
    });
  }

  const resolverInput = BRACKET_ORDER.filter((s) => byStage.get(s)).map((stage) => {
    const r = resultByStage.get(stage)!;
    const c = r32CountryByStage.get(stage);
    return {
      stage,
      countryLeftId: c?.left,
      countryRightId: c?.right,
      goalsLeft: r.goalsLeft,
      goalsRight: r.goalsRight,
      penaltisLeft: r.penaltisLeft,
      penaltisRight: r.penaltisRight,
    };
  });

  const resolved = resolveFinalsMatches(
    resolverInput,
    getAdminFinalsMatchWinner,
    getAdminFinalsMatchLooser,
  );

  const resolvedByStage = new Map(resolved.map((r) => [r.stage, r]));
  for (const stage of BRACKET_ORDER) {
    const m = byStage.get(stage);
    if (!m) continue;
    const r = resolvedByStage.get(stage)!;
    await prisma.match.update({
      where: { id: m.id },
      data: {
        countryLeftId: r.countryLeftId ?? null,
        countryRightId: r.countryRightId ?? null,
        goalsLeft: r.goalsLeft ?? null,
        goalsRight: r.goalsRight ?? null,
        penaltisLeft: r.penaltisLeft ?? null,
        penaltisRight: r.penaltisRight ?? null,
        filled: true,
      },
    });
  }

  return prode;
}

async function main() {
  loadHarnessEnv();

  const { prisma } = await import("@/lib");

  const count = parseCount(process.argv.slice(2));
  const prode = await ensureTournament(prisma);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@dev.local";
  const roomName = process.env.HISTOGRAM_ROOM_NAME ?? "Harness Room";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "admin", prodePublic: true },
    update: { name: "admin", prodePublic: true },
  });

  let room = await prisma.prodeRoom.findFirst({
    where: { prodeId: prode.id, name: roomName },
  });
  if (!room) {
    room = await prisma.prodeRoom.create({
      data: {
        created: new Date("2026-06-01T00:00:00.000Z"),
        userId: admin.id,
        prodeId: prode.id,
        name: roomName,
        public: true,
        password: null,
        emailDomain: null,
        pointsWinner: 1,
        pointsGoals: 3,
        pointsPenal: 5,
      },
    });
  }

  const userRows: Array<{ email: string; tier: Tier; rng: () => number }> = [];
  for (let i = 1; i <= count; i++) {
    const tier = TIERS[(i - 1) % TIERS.length];
    userRows.push({
      email: `hist-${String(i).padStart(2, "0")}@dev.local`,
      tier,
      rng: mulberry32(0xabc000 + i * 9973),
    });
  }

  const groupMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: GROUP_STAGES as never } },
    orderBy: { date: "asc" },
  });
  const finalsMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: BRACKET_ORDER as never } },
    orderBy: { date: "asc" },
  });

  for (const [index, row] of userRows.entries()) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      create: {
        email: row.email,
        name: `Player ${String(index + 1).padStart(2, "0")}`,
        prodePublic: true,
      },
      update: {
        name: `Player ${String(index + 1).padStart(2, "0")}`,
        prodePublic: true,
      },
    });

    const userProde = await prisma.userProde.upsert({
      where: {
        userId_prodeRoomId: {
          userId: user.id,
          prodeRoomId: room.id,
        },
      },
      create: {
        created: new Date("2026-06-01T00:00:00.000Z"),
        prodeId: prode.id,
        userId: user.id,
        prodeRoomId: room.id,
      },
      update: {
        deletedAt: null,
      },
    });

    await prisma.prodeUserGroupMatch.deleteMany({ where: { userProdeId: userProde.id } });
    await prisma.prodeUserFinalsMatch.deleteMany({ where: { userProdeId: userProde.id } });

    await prisma.prodeUserGroupMatch.createMany({
      data: groupMatches.map((match) => {
        const actual = {
          goalsLeft: match.goalsLeft ?? 0,
          goalsRight: match.goalsRight ?? 0,
          penaltisLeft: match.penaltisLeft,
          penaltisRight: match.penaltisRight,
        };
        const outcome = pickOutcome(row.rng, row.tier.group);
        const predicted = makeGroupPrediction(actual, outcome);
        return {
          userProdeId: userProde.id,
          matchId: match.id,
          goalsLeft: predicted.goalsLeft,
          goalsRight: predicted.goalsRight,
        };
      }),
    });

    await prisma.prodeUserFinalsMatch.createMany({
      data: finalsMatches
        .filter((match) => match.countryLeftId && match.countryRightId)
        .map((match) => {
          const actual = {
            goalsLeft: match.goalsLeft ?? 0,
            goalsRight: match.goalsRight ?? 0,
            penaltisLeft: match.penaltisLeft,
            penaltisRight: match.penaltisRight,
          };
          const outcome = pickOutcome(row.rng, row.tier.finals);
          const predicted = makeFinalPrediction(actual, outcome);
          return {
            userProdeId: userProde.id,
            matchId: match.id,
            goalsLeft: predicted.goalsLeft,
            goalsRight: predicted.goalsRight,
            penaltisLeft: predicted.penaltisLeft,
            penaltisRight: predicted.penaltisRight,
            countryLeftId: match.countryLeftId!,
            countryRightId: match.countryRightId!,
          };
        }),
    });
  }

  console.log(
    `Seeded ${userRows.length} histogram users in room "${room.name}" (${room.id}). ` +
      `Use the ranking page to inspect points, group-result, and final-score histograms.`,
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
});
