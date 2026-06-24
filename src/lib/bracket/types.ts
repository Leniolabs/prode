import type { Stage } from "@/generated/prisma";

export type Group =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export const GROUPS: Group[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export function groupStage(group: Group): Stage {
  return `GROUP_${group}` as Stage;
}

// One played group match: the two teams and the final score.
export type GroupMatchResult = {
  countryLeftId: string;
  countryRightId: string;
  goalsLeft: number;
  goalsRight: number;
};

export type TeamStanding = {
  countryId: string;
  group: Group;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number; // 1-based position within the group
};

// A reference to a qualifying team by its group position, used to define which
// team fills each side of a round-of-32 match.
export type R32Position =
  | { kind: "winner"; group: Group }
  | { kind: "runnerUp"; group: Group }
  | { kind: "thirdPlace"; slot: string }; // slot label in THIRD_PLACE_SLOT_ORDER

export type R32Slot = {
  stage: Stage;
  home: R32Position;
  away: R32Position;
};
