import { prisma } from "@/lib/prisma";
import { fetchTeams } from "./client";

export type LinkResult = { linked: number; unmatched: string[] };

// Links Country.externalId to the ESPN team catalog by FIFA abbreviation, which
// is the key the round-of-32 populate step uses to map ESPN teams onto our
// rows. Idempotent and forward-only: countries already linked are left
// untouched, and the ESPN catalog is only fetched when at least one country is
// still unlinked — so once everything is linked this costs a single COUNT and
// no network call, making it safe to run on every sync tick. Matching on code
// (not display name) keeps it robust against ESPN's spelling variants
// (Czechia, Türkiye, Curaçao, etc.).
export async function linkCountryExternalIds(): Promise<LinkResult> {
  const unlinked = await prisma.country.count({ where: { externalId: null } });
  if (unlinked === 0) return { linked: 0, unmatched: [] };

  const teams = await fetchTeams();
  const idByCode = new Map<string, number>();
  for (const team of teams) {
    const code = team.abbreviation?.toUpperCase();
    const id = Number(team.id);
    if (code && Number.isInteger(id)) idByCode.set(code, id);
  }

  const countries = await prisma.country.findMany({
    where: { externalId: null },
    select: { id: true, code: true, name: true },
  });

  let linked = 0;
  const unmatched: string[] = [];
  for (const country of countries) {
    const externalId = idByCode.get(country.code.toUpperCase());
    if (externalId === undefined) {
      unmatched.push(`${country.code} (${country.name})`);
      continue;
    }
    await prisma.country.update({
      where: { id: country.id },
      data: { externalId },
    });
    linked++;
  }

  return { linked, unmatched };
}
