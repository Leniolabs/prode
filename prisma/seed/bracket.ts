import { PrismaClient, Stage } from "@prisma/client";

type BracketMatch = { stage: Stage; date: string };

const R32_MATCHES: BracketMatch[] = [
  { stage: "FINALS_16_1", date: "2026-07-04T17:00:00.000Z" },
  { stage: "FINALS_16_2", date: "2026-07-04T21:00:00.000Z" },
  { stage: "FINALS_16_3", date: "2026-07-05T17:00:00.000Z" },
  { stage: "FINALS_16_4", date: "2026-07-05T21:00:00.000Z" },
  { stage: "FINALS_16_5", date: "2026-07-06T17:00:00.000Z" },
  { stage: "FINALS_16_6", date: "2026-07-06T21:00:00.000Z" },
  { stage: "FINALS_16_7", date: "2026-07-07T17:00:00.000Z" },
  { stage: "FINALS_16_8", date: "2026-07-07T21:00:00.000Z" },
  { stage: "FINALS_16_9", date: "2026-07-08T17:00:00.000Z" },
  { stage: "FINALS_16_10", date: "2026-07-08T21:00:00.000Z" },
  { stage: "FINALS_16_11", date: "2026-07-09T17:00:00.000Z" },
  { stage: "FINALS_16_12", date: "2026-07-09T21:00:00.000Z" },
  { stage: "FINALS_16_13", date: "2026-07-10T17:00:00.000Z" },
  { stage: "FINALS_16_14", date: "2026-07-10T21:00:00.000Z" },
  { stage: "FINALS_16_15", date: "2026-07-11T17:00:00.000Z" },
  { stage: "FINALS_16_16", date: "2026-07-11T21:00:00.000Z" },
];

const R16_MATCHES: BracketMatch[] = [
  { stage: "FINALS_8_1", date: "2026-07-15T17:00:00.000Z" },
  { stage: "FINALS_8_2", date: "2026-07-15T21:00:00.000Z" },
  { stage: "FINALS_8_3", date: "2026-07-16T17:00:00.000Z" },
  { stage: "FINALS_8_4", date: "2026-07-16T21:00:00.000Z" },
  { stage: "FINALS_8_5", date: "2026-07-17T17:00:00.000Z" },
  { stage: "FINALS_8_6", date: "2026-07-17T21:00:00.000Z" },
  { stage: "FINALS_8_7", date: "2026-07-18T17:00:00.000Z" },
  { stage: "FINALS_8_8", date: "2026-07-18T21:00:00.000Z" },
];

const QF_MATCHES: BracketMatch[] = [
  { stage: "FINALS_4_1", date: "2026-07-22T21:00:00.000Z" },
  { stage: "FINALS_4_2", date: "2026-07-22T17:00:00.000Z" },
  { stage: "FINALS_4_3", date: "2026-07-23T21:00:00.000Z" },
  { stage: "FINALS_4_4", date: "2026-07-23T17:00:00.000Z" },
];

const SF_MATCHES: BracketMatch[] = [
  { stage: "FINALS_2_1", date: "2026-07-26T21:00:00.000Z" },
  { stage: "FINALS_2_2", date: "2026-07-27T21:00:00.000Z" },
];

const FINAL_MATCHES: BracketMatch[] = [
  { stage: "FINALS", date: "2026-07-19T19:00:00.000Z" },
  { stage: "THIRD_PLACE", date: "2026-07-19T15:00:00.000Z" },
];

const ALL_BRACKET_STAGES = [
  ...R32_MATCHES,
  ...R16_MATCHES,
  ...QF_MATCHES,
  ...SF_MATCHES,
  ...FINAL_MATCHES,
];

export async function seedBracket(prisma: PrismaClient, prodeId: string) {
  // Remove existing knockout matches for this prode
  await prisma.match.deleteMany({
    where: {
      prodeId,
      stage: {
        in: ALL_BRACKET_STAGES.map((m) => m.stage),
      },
    },
  });

  const matchData = ALL_BRACKET_STAGES.map(({ stage, date }) => ({
    prodeId,
    stage,
    countryLeftId: null as string | null,
    countryRightId: null as string | null,
    goalsLeft: null as number | null,
    goalsRight: null as number | null,
    penaltisLeft: null as number | null,
    penaltisRight: null as number | null,
    filled: false,
    date: new Date(date),
  }));

  await prisma.match.createMany({ data: matchData });
  console.log(`Seeded ${matchData.length} knockout-bracket matches.`);
}
