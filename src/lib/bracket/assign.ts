import { R32_SLOTS } from "./r32-slots";
import { rankThirdPlaced } from "./standings";
import {
  THIRD_PLACE_COMBINATIONS,
  THIRD_PLACE_SLOT_ORDER,
} from "./third-place-table";
import { GROUPS, type Group, type R32Position, type TeamStanding } from "./types";

export type R32Assignment = {
  stage: string;
  homeCountryId: string;
  awayCountryId: string;
};

function teamAt(standings: TeamStanding[], rank: number): TeamStanding | undefined {
  return standings.find((s) => s.rank === rank);
}

// Resolves the 32 round-of-32 participants from the finished group standings.
// Returns null when standings are incomplete (any group missing its top three),
// since the third-placed qualification cannot be computed until every group is
// final. Throws only on a genuine data inconsistency (unknown combination key).
export function resolveRoundOf32(
  standingsByGroup: Map<Group, TeamStanding[]>,
): R32Assignment[] | null {
  // Every group must have a decided top three.
  for (const group of GROUPS) {
    const standings = standingsByGroup.get(group);
    if (!standings || !teamAt(standings, 1) || !teamAt(standings, 2) || !teamAt(standings, 3)) {
      return null;
    }
  }

  const thirds = GROUPS.map((group) => teamAt(standingsByGroup.get(group)!, 3)!);
  const qualifiers = rankThirdPlaced(thirds).slice(0, 8);
  const qualifyingGroups = qualifiers.map((t) => t.group);
  const key = [...qualifyingGroups].sort().join("");

  const assignment = THIRD_PLACE_COMBINATIONS[key];
  if (!assignment) {
    throw new Error(`No third-place combination for qualifying groups "${key}"`);
  }

  // slot label (e.g. "1E") -> the group whose third-placed team fills that slot.
  const slotToGroup = new Map<string, Group>();
  THIRD_PLACE_SLOT_ORDER.forEach((slot, index) => {
    slotToGroup.set(slot, assignment[index] as Group);
  });

  const resolve = (position: R32Position): string => {
    if (position.kind === "winner") {
      return teamAt(standingsByGroup.get(position.group)!, 1)!.countryId;
    }
    if (position.kind === "runnerUp") {
      return teamAt(standingsByGroup.get(position.group)!, 2)!.countryId;
    }
    const group = slotToGroup.get(position.slot)!;
    return teamAt(standingsByGroup.get(group)!, 3)!.countryId;
  };

  return R32_SLOTS.map((slot) => ({
    stage: slot.stage,
    homeCountryId: resolve(slot.home),
    awayCountryId: resolve(slot.away),
  }));
}
