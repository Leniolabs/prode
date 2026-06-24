/**
 * Read-only diagnostic: verifies that Country.externalId is linked to the ESPN
 * team catalog, so the round-of-32 populate step (which maps ESPN team ids to
 * our Country rows) can actually resolve teams. Writes nothing — safe to run
 * against prod.
 *
 *   DATABASE_URL=<url> tsx prisma/seed/check-espn-links.ts
 *
 * Exit code is non-zero when any ESPN team has no linked Country, so it can
 * gate a deploy or be eyeballed before the knockouts begin.
 */

import { PrismaClient } from "../../src/generated/prisma";
import { fetchTeams } from "../../src/lib/espn/client";

const WC_SEASON = 2026;

async function main() {
  const prisma = new PrismaClient();

  try {
    const teams = await fetchTeams(WC_SEASON);
    const countries = await prisma.country.findMany({
      select: { code: true, name: true, externalId: true },
    });

    const byCode = new Map(countries.map((c) => [c.code.toUpperCase(), c]));

    const linked: string[] = [];
    const missingExternalId: string[] = [];
    const wrongExternalId: string[] = [];
    const codeNotFound: string[] = [];

    for (const team of teams) {
      const abbr = team.abbreviation?.toUpperCase();
      const espnId = Number(team.id);
      if (!abbr || !Number.isInteger(espnId)) continue;

      const country = byCode.get(abbr);
      if (!country) {
        codeNotFound.push(`${abbr} (${team.displayName ?? "?"})`);
        continue;
      }

      if (country.externalId === null) {
        missingExternalId.push(`${abbr} ${country.name}`);
      } else if (country.externalId !== espnId) {
        wrongExternalId.push(
          `${abbr} ${country.name}: stored ${country.externalId}, ESPN ${espnId}`,
        );
      } else {
        linked.push(`${abbr} → ${espnId}`);
      }
    }

    console.log(`ESPN teams: ${teams.length}`);
    console.log(`Linked correctly: ${linked.length}`);

    if (missingExternalId.length) {
      console.warn(`\nMissing externalId (run espn-countries.ts): ${missingExternalId.length}`);
      missingExternalId.forEach((m) => console.warn(`  - ${m}`));
    }
    if (wrongExternalId.length) {
      console.warn(`\nMismatched externalId: ${wrongExternalId.length}`);
      wrongExternalId.forEach((m) => console.warn(`  - ${m}`));
    }
    if (codeNotFound.length) {
      console.warn(`\nESPN team with no matching Country.code: ${codeNotFound.length}`);
      codeNotFound.forEach((m) => console.warn(`  - ${m}`));
    }

    const problems = missingExternalId.length + wrongExternalId.length + codeNotFound.length;
    if (problems === 0) {
      console.log("\nAll ESPN teams are linked. Round-of-32 populate can resolve every team.");
    } else {
      console.error(`\n${problems} issue(s) found — populate will silently skip those teams.`);
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
