/**
 * One-time script: populates Country.externalId from the ESPN team catalog.
 *
 * Run once before the first sync:
 *   DATABASE_URL=<url> tsx prisma/seed/espn-countries.ts
 *
 * Safe to re-run — skips countries that already have an externalId.
 *
 * ESPN identifies teams by a numeric id and a 3-letter `abbreviation`. Most of
 * those abbreviations match our Country.code exactly; the few that don't are
 * remapped below. Matching on code (not display name) keeps this robust against
 * Spanish/English name differences and ESPN's spelling variants (Czechia,
 * Türkiye, Curaçao, etc.).
 */

import { PrismaClient } from "../../src/generated/prisma";
import { fetchTeams } from "../../src/lib/espn/client";

const WC_SEASON = 2026;

// ESPN abbreviation -> our Country.code, only where they differ.
const ABBR_OVERRIDES: Record<string, string> = {
  CRO: "HRV",
  GER: "DEU",
  NED: "NLD",
  POR: "PRT",
  KSA: "SAU",
  SUI: "CHE",
};

async function main() {
  const prisma = new PrismaClient();

  try {
    const teams = await fetchTeams(WC_SEASON);
    console.log(`Fetched ${teams.length} teams from ESPN`);

    const countries = await prisma.country.findMany();
    const byCode = new Map(countries.map((c) => [c.code, c]));

    let linked = 0;
    const notFound: string[] = [];

    for (const team of teams) {
      const abbr = team.abbreviation?.toUpperCase();
      if (!abbr || !team.id) continue;

      const code = ABBR_OVERRIDES[abbr] ?? abbr;
      const country = byCode.get(code);

      if (!country) {
        notFound.push(`${abbr} (${team.displayName ?? "?"})`);
        continue;
      }

      const externalId = Number(team.id);
      if (!Number.isInteger(externalId)) {
        notFound.push(`${abbr} bad id ${team.id}`);
        continue;
      }

      if (country.externalId !== null) continue; // already linked

      await prisma.country.update({
        where: { id: country.id },
        data: { externalId },
      });

      console.log(`  ✓ ${country.name} (${code}) → externalId ${externalId}`);
      linked++;
    }

    console.log(`\nLinked: ${linked}`);
    if (notFound.length) {
      console.warn(`Not matched (check ABBR_OVERRIDES / countries.ts):`);
      notFound.forEach((n) => console.warn(`  - ${n}`));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
