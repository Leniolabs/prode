// Demo seed: populate a fully-played tournament so the /groups and /finals
// pages render with real-looking data ("all results in" state).
//
// What it does:
//   1. Ensures the WC2026 prode, countries, group fixture, and knockout
//      bracket exist (reuses the canonical seeders — idempotent).
//   2. Fills every group + knockout match with a final result (filled=true)
//      and propagates the bracket so each knockout match has two real teams.
//   3. Flips the prode to the FINALS phase (otherwise /finals redirects to
//      /groups via finalsStarted()).
//   4. Attaches a realistic spread of template predictions (exact / winner /
//      wrong) for the target users, so every badge state shows up.
//
// Predictions only render for the logged-in user, so pass the email you log
// in with. With no argument it seeds predictions for every existing user.
//
//   npx tsx prisma/seed/demo-results.ts you@example.com
//   npm run seed:demo -- you@example.com
//
// Re-running is safe; it overwrites the template predictions each time.

import { loadHarnessEnv } from "../../harness/env";

const GROUP_STAGES = [
  "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D",
  "GROUP_E", "GROUP_F", "GROUP_G", "GROUP_H",
  "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
] as const;

// Knockout stages in dependency order (sources before dependents) so the
// bracket can be resolved in a single pass.
const BRACKET_ORDER = [
  ...Array.from({ length: 16 }, (_, i) => `FINALS_16_${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `FINALS_8_${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `FINALS_4_${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `FINALS_2_${i + 1}`),
  "FINALS",
  "THIRD_PLACE",
];

type Outcome = "EXACT" | "WINNER" | "WRONG" | "DRAW";

// Actual scoreline for a match, by index. Mostly decisive (a winner always
// exists so the bracket propagates cleanly); one draw-with-penalties per dozen
// to exercise the penalty UI.
function actualResult(i: number) {
  if (i % 12 === 5) {
    return { goalsLeft: 1, goalsRight: 1, penaltisLeft: 4, penaltisRight: 2 };
  }
  return i % 2 === 0
    ? { goalsLeft: 2, goalsRight: 1, penaltisLeft: null, penaltisRight: null }
    : { goalsLeft: 0, goalsRight: 2, penaltisLeft: null, penaltisRight: null };
}

// User prediction relative to the actual result, cycling through every badge
// category so the demo shows green / yellow / red.
function prediction(
  actual: { goalsLeft: number; goalsRight: number; penaltisLeft: number | null; penaltisRight: number | null },
  outcome: Outcome,
) {
  const { goalsLeft: aL, goalsRight: aR } = actual;
  switch (outcome) {
    case "EXACT":
      return {
        goalsLeft: aL, goalsRight: aR,
        penaltisLeft: actual.penaltisLeft, penaltisRight: actual.penaltisRight,
      };
    case "DRAW":
      // Predict a draw (matches a real draw → WINNER_MATCH; else WRONG).
      return { goalsLeft: 1, goalsRight: 1, penaltisLeft: null, penaltisRight: null };
    case "WINNER": {
      // Same winner, different scoreline.
      if (aL > aR) return { goalsLeft: aL + 1, goalsRight: aR, penaltisLeft: null, penaltisRight: null };
      if (aL < aR) return { goalsLeft: aL, goalsRight: aR + 1, penaltisLeft: null, penaltisRight: null };
      return { goalsLeft: 2, goalsRight: 0, penaltisLeft: null, penaltisRight: null };
    }
    case "WRONG":
    default: {
      // Opposite winner.
      if (aL >= aR) return { goalsLeft: 0, goalsRight: 2, penaltisLeft: null, penaltisRight: null };
      return { goalsLeft: 2, goalsRight: 0, penaltisLeft: null, penaltisRight: null };
    }
  }
}

const OUTCOME_CYCLE: Outcome[] = ["EXACT", "WINNER", "WRONG", "EXACT", "DRAW", "WINNER", "WRONG"];

async function main() {
  loadHarnessEnv();

  const { prisma } = await import("@/lib");
  const { seedCountries } = await import("./countries");
  const { seedFixture } = await import("./fixture");
  const { seedBracket } = await import("./bracket");
  const { getAdminFinalsMatchWinner, getAdminFinalsMatchLooser } = await import("@/lib/scoring");
  const { resolveFinalsMatches } = await import("@/utils/finals");

  const targetEmail = process.argv[2];

  // 1. Ensure structural data exists (idempotent).
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
    update: { stage: "FINALS" }, // 3. flip to FINALS phase
  });
  await seedFixture(prisma, prode.id);
  await seedBracket(prisma, prode.id);

  // 2a. Fill every group-stage result.
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

  // 2b. Assign the 32 Round-of-32 teams, then fill goals for every knockout
  // match, then propagate winners/losers up the bracket.
  const countries = await prisma.country.findMany({ orderBy: { code: "asc" }, take: 32 });
  const bracketMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: BRACKET_ORDER as never } },
  });
  const byStage = new Map(bracketMatches.map((m) => [m.stage as string, m]));

  // Fill goals on every knockout match (independent of which teams play).
  const resultByStage = new Map<string, ReturnType<typeof actualResult>>();
  BRACKET_ORDER.forEach((stage, i) => {
    const m = byStage.get(stage);
    if (!m) return;
    resultByStage.set(stage, actualResult(i));
  });

  // Seed R32 country slots.
  const r32CountryByStage = new Map<string, { left: string; right: string }>();
  for (let n = 1; n <= 16; n++) {
    const stage = `FINALS_16_${n}`;
    if (!byStage.get(stage)) continue;
    r32CountryByStage.set(stage, {
      left: countries[(n - 1) * 2].id,
      right: countries[(n - 1) * 2 + 1].id,
    });
  }

  // Build resolver input in dependency order; R32 has countries, the rest are
  // filled in by resolveFinalsMatches from their source matches.
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

  // Persist filled goals + resolved teams onto each knockout match.
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

  // 4. Attach template predictions for each target user.
  const users = targetEmail
    ? await prisma.user.findMany({ where: { email: targetEmail } })
    : await prisma.user.findMany();

  if (users.length === 0) {
    console.log(
      targetEmail
        ? `No user found with email ${targetEmail}. Log in once, then re-run.`
        : `No users exist yet. Log in once, then re-run with your email.`,
    );
  }

  const filledGroupMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: GROUP_STAGES as never } },
    orderBy: { date: "asc" },
  });
  const filledBracketMatches = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: BRACKET_ORDER as never } },
  });

  for (const user of users) {
    let template = await prisma.userProde.findFirst({
      where: { userId: user.id, prodeRoomId: null, template: true },
    });
    if (!template) {
      template = await prisma.userProde.create({
        data: { prodeId: prode.id, userId: user.id, template: true, prodeRoomId: null, created: new Date() },
      });
    }

    // Reset any previous template predictions so re-runs are clean.
    await prisma.prodeUserGroupMatch.deleteMany({ where: { userProdeId: template.id } });
    await prisma.prodeUserFinalsMatch.deleteMany({ where: { userProdeId: template.id } });

    // Group predictions.
    await prisma.prodeUserGroupMatch.createMany({
      data: filledGroupMatches.map((m, i) => {
        const p = prediction(
          { goalsLeft: m.goalsLeft!, goalsRight: m.goalsRight!, penaltisLeft: m.penaltisLeft, penaltisRight: m.penaltisRight },
          OUTCOME_CYCLE[i % OUTCOME_CYCLE.length],
        );
        return { userProdeId: template!.id, matchId: m.id, goalsLeft: p.goalsLeft, goalsRight: p.goalsRight };
      }),
    });

    // Finals predictions. Keep predicted teams equal to the actual teams (so
    // country status reads MATCH); vary goals to drive the result badge. Every
    // 6th match swaps the predicted teams to demo a wrong-country status.
    await prisma.prodeUserFinalsMatch.createMany({
      data: filledBracketMatches
        .filter((m) => m.countryLeftId && m.countryRightId)
        .map((m, i) => {
          const outcome = OUTCOME_CYCLE[i % OUTCOME_CYCLE.length];
          const p = prediction(
            { goalsLeft: m.goalsLeft!, goalsRight: m.goalsRight!, penaltisLeft: m.penaltisLeft, penaltisRight: m.penaltisRight },
            outcome,
          );
          const wrongCountry = i % 6 === 5;
          return {
            userProdeId: template!.id,
            matchId: m.id,
            goalsLeft: p.goalsLeft,
            goalsRight: p.goalsRight,
            penaltisLeft: p.penaltisLeft,
            penaltisRight: p.penaltisRight,
            countryLeftId: wrongCountry ? m.countryRightId! : m.countryLeftId!,
            countryRightId: wrongCountry ? m.countryLeftId! : m.countryRightId!,
          };
        }),
    });
  }

  console.log(
    `Demo seed complete. ${groupMatches.length} group + ${bracketMatches.length} knockout matches filled; ` +
      `predictions attached for ${users.length} user(s)${targetEmail ? ` (${targetEmail})` : ""}. ` +
      `Prode "${prode.id}" is in the FINALS phase.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
