import { prisma } from "@/lib/prisma";
import { getFinalsStageGroup } from "@/utils/finals";

export type KnockoutPhaseAccess = {
  roundOf32Open: boolean;
  finalsBracketOpen: boolean;
};

export type TournamentLandingStage = "groups" | "16avos" | "finals";

type TournamentMatchStage = {
  stage: string;
  date: Date;
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

function stagePriority(stage: string) {
  if (stage.startsWith("GROUP_")) return 0;

  const finalsGroup = getFinalsStageGroup(stage);
  if (finalsGroup === "FINALS_16") return 1;
  if (finalsGroup) return 2;

  return 3;
}

function landingStageForMatchStage(stage: string): TournamentLandingStage {
  if (stage.startsWith("GROUP_")) return "groups";

  const finalsGroup = getFinalsStageGroup(stage);
  if (finalsGroup === "FINALS_16") return "16avos";
  if (finalsGroup) return "finals";

  return "groups";
}

export function getTournamentLandingStageFromMatches(
  matches: TournamentMatchStage[],
  now: Date = new Date(),
): TournamentLandingStage {
  if (!matches.length) return "groups";

  const sorted = [...matches].sort((left, right) => {
    const dateDiff = left.date.getTime() - right.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return stagePriority(left.stage) - stagePriority(right.stage);
  });

  const upcoming = sorted.find((match) => match.date.getTime() >= now.getTime());
  const candidate = upcoming ?? sorted[sorted.length - 1];

  return landingStageForMatchStage(candidate.stage);
}

export async function getTournamentLandingStage(): Promise<TournamentLandingStage> {
  const prode = await prisma.prode.findFirst({ select: { id: true } });
  if (!prode) return "groups";

  const matches = await prisma.match.findMany({
    where: { prodeId: prode.id },
    select: { stage: true, date: true },
  });

  return getTournamentLandingStageFromMatches(matches);
}
