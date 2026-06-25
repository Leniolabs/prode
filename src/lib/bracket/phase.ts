import { prisma } from "@/lib/prisma";

export type KnockoutPhaseAccess = {
  roundOf32Open: boolean;
  finalsBracketOpen: boolean;
};

// Knockout pages auto-enable from bracket data rather than a manual stage flip.
// The round-of-32 page opens once any FINALS_16 slot has both countries seeded;
// the finals bracket page opens once any later-round slot (FINALS_8 and beyond)
// has both countries, i.e. the first R32 winner has advanced.
export async function knockoutPhaseAccess(): Promise<KnockoutPhaseAccess> {
  const prode = await prisma.prode.findFirst({ select: { id: true } });
  if (!prode) return { roundOf32Open: false, finalsBracketOpen: false };

  const seeded = await prisma.match.findMany({
    where: {
      prodeId: prode.id,
      countryLeftId: { not: null },
      countryRightId: { not: null },
    },
    select: { stage: true },
  });

  let roundOf32Open = false;
  let finalsBracketOpen = false;
  for (const { stage } of seeded) {
    if (stage.startsWith("FINALS_16_")) roundOf32Open = true;
    else if (
      stage.startsWith("FINALS_8_") ||
      stage.startsWith("FINALS_4_") ||
      stage.startsWith("FINALS_2_") ||
      stage === "FINALS" ||
      stage === "THIRD_PLACE"
    )
      finalsBracketOpen = true;
  }

  return { roundOf32Open, finalsBracketOpen };
}
