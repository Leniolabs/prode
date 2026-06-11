// Throwaway: start the finals phase and populate the R32 bracket with teams so
// the knockout/brackets page can be viewed with real data.
import { loadHarnessEnv } from "./env";

const R32 = Array.from({ length: 16 }, (_, i) => `FINALS_16_${i + 1}`);
const ALL_FINALS = [
  ...R32,
  ...Array.from({ length: 8 }, (_, i) => `FINALS_8_${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `FINALS_4_${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `FINALS_2_${i + 1}`),
  "FINALS",
  "THIRD_PLACE",
];

async function main() {
  loadHarnessEnv();
  const { prisma } = await import("../src/lib");

  const prode = await prisma.prode.findFirst();
  if (!prode) throw new Error("no prode found");

  // 1. Ensure all bracket-stage Match rows exist.
  const existing = await prisma.match.findMany({
    where: { prodeId: prode.id, stage: { in: ALL_FINALS as never } },
    select: { id: true, stage: true },
  });
  const have = new Set(existing.map((m) => m.stage as string));
  const missing = ALL_FINALS.filter((s) => !have.has(s));
  if (missing.length) {
    await prisma.match.createMany({
      data: missing.map((stage) => ({
        prodeId: prode.id,
        stage: stage as never,
        filled: false,
        date: new Date("2026-07-01T18:00:00.000Z"),
      })),
    });
  }

  // 2. Assign real teams to the 16 Round-of-32 matches (32 countries).
  const countries = await prisma.country.findMany({
    take: 32,
    orderBy: { code: "asc" },
  });
  if (countries.length >= 32) {
    const r32 = await prisma.match.findMany({
      where: { prodeId: prode.id, stage: { in: R32 as never } },
      select: { id: true, stage: true },
    });
    for (const m of r32) {
      const n = parseInt((m.stage as string).replace("FINALS_16_", ""), 10);
      await prisma.match.update({
        where: { id: m.id },
        data: {
          countryLeftId: countries[(n - 1) * 2].id,
          countryRightId: countries[(n - 1) * 2 + 1].id,
        },
      });
    }
  }

  // 3. Start the finals phase (finalsStarted() checks Prode.stage === 'FINALS').
  await prisma.prode.update({
    where: { id: prode.id },
    data: { stage: "FINALS" as never },
  });

  console.log(
    `finals started · ${ALL_FINALS.length} bracket stages ensured · R32 teams assigned from ${countries.length} countries`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
