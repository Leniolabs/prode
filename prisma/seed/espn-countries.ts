/**
 * One-time script: populates Country.externalId from the ESPN team catalog.
 *
 *   DATABASE_URL=<url> tsx prisma/seed/espn-countries.ts
 *
 * Safe to re-run — skips countries that already have an externalId. This is now
 * also done automatically on every sync tick (see lib/espn/link-countries.ts);
 * this script is kept for an explicit one-off run during setup or backfill.
 */

import { linkCountryExternalIds } from "../../src/lib/espn/link-countries";

async function main() {
  const { linked, unmatched } = await linkCountryExternalIds();

  console.log(`Linked: ${linked}`);
  if (unmatched.length) {
    console.warn(`Not matched (check countries.ts codes vs ESPN abbreviations):`);
    unmatched.forEach((n) => console.warn(`  - ${n}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
