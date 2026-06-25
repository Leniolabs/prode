import { prisma } from "@/lib/prisma";
import { resolveRoundOf32 } from "./assign";
import { computeGroupStandings } from "./standings";
import { GROUPS, groupStage, type Group, type GroupMatchResult, type TeamStanding } from "./types";

export type SeedResult = { seeded: number; skipped: boolean };

const GROUP_STAGES = GROUPS.map(groupStage);

// Seeds the round-of-32 participants for a single prode by computing the final
// group standings from played group matches and applying the FIFA slotting +
// third-place table. Forward-only: a slot is only written when the computed
// team differs from what is stored. No-op (skipped) until every group match has
// a result, because third-placed qualification needs every group to be final.
export async function seedRoundOf32(prodeId: string): Promise<SeedResult> {
  const groupMatches = await prisma.match.findMany({
    where: { prodeId, stage: { in: GROUP_STAGES } },
    select: {
      stage: true,
      goalsLeft: true,
      goalsRight: true,
      countryLeftId: true,
      countryRightId: true,
    },
  });

  const hasUnplayed = groupMatches.some(
    (m) =>
      m.goalsLeft === null ||
      m.goalsRight === null ||
      !m.countryLeftId ||
      !m.countryRightId,
  );
  if (groupMatches.length === 0 || hasUnplayed) {
    return { seeded: 0, skipped: true };
  }

  const standingsByGroup = new Map<Group, TeamStanding[]>();
  for (const group of GROUPS) {
    const stage = groupStage(group);
    const results: GroupMatchResult[] = groupMatches
      .filter((m) => m.stage === stage)
      .map((m) => ({
        countryLeftId: m.countryLeftId!,
        countryRightId: m.countryRightId!,
        goalsLeft: m.goalsLeft!,
        goalsRight: m.goalsRight!,
      }));
    standingsByGroup.set(group, computeGroupStandings(group, results));
  }

  const assignments = resolveRoundOf32(standingsByGroup);
  if (!assignments) {
    return { seeded: 0, skipped: true };
  }

  const slots = await prisma.match.findMany({
    where: { prodeId, stage: { in: assignments.map((a) => a.stage as never) } },
    select: { id: true, stage: true, countryLeftId: true, countryRightId: true },
  });
  const slotByStage = new Map(slots.map((s) => [s.stage as string, s]));

  let seeded = 0;
  for (const assignment of assignments) {
    const slot = slotByStage.get(assignment.stage);
    if (!slot) continue;

    const data: { countryLeftId?: string; countryRightId?: string } = {};
    if (assignment.homeCountryId !== slot.countryLeftId) {
      data.countryLeftId = assignment.homeCountryId;
    }
    if (assignment.awayCountryId !== slot.countryRightId) {
      data.countryRightId = assignment.awayCountryId;
    }
    if (Object.keys(data).length === 0) continue;

    await prisma.match.update({ where: { id: slot.id }, data });
    seeded++;
  }

  return { seeded, skipped: false };
}

// Seeds the round of 32 for every prode that has knockout matches.
export async function seedRoundOf32All(): Promise<SeedResult> {
  const prodes = await prisma.match.findMany({
    where: { stage: { in: GROUP_STAGES } },
    select: { prodeId: true },
    distinct: ["prodeId"],
  });

  let seeded = 0;
  let skipped = true;
  for (const { prodeId } of prodes) {
    const result = await seedRoundOf32(prodeId);
    seeded += result.seeded;
    if (!result.skipped) skipped = false;
  }
  return { seeded, skipped };
}
