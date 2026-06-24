export type FinalsStageGroup =
  | "FINALS_16"
  | "FINALS_8"
  | "FINALS_4"
  | "FINALS_2"
  | "FINAL";

type FinalsSourceStageMap = Record<
  string,
  {
    left: string;
    right: string;
    mode: "winner" | "loser";
  }
>;

const FINAL_GROUP_PREFIXES: Record<Exclude<FinalsStageGroup, "FINAL">, string> = {
  FINALS_16: "FINALS_16_",
  FINALS_8: "FINALS_8_",
  FINALS_4: "FINALS_4_",
  FINALS_2: "FINALS_2_",
};

const FINAL_ORDER_MAP: Record<string, number> = {
  FINALS_16_1: 1,
  FINALS_16_2: 2,
  FINALS_16_3: 3,
  FINALS_16_4: 4,
  FINALS_16_5: 5,
  FINALS_16_6: 6,
  FINALS_16_7: 7,
  FINALS_16_8: 8,
  FINALS_16_9: 9,
  FINALS_16_10: 10,
  FINALS_16_11: 11,
  FINALS_16_12: 12,
  FINALS_16_13: 13,
  FINALS_16_14: 14,
  FINALS_16_15: 15,
  FINALS_16_16: 16,
  // Octavos sit 4-per-row (row1 = orders 1-4, row2 = orders 5-8), so column k
  // stacks order k above order k+4. The two octavos feeding a quarterfinal must
  // share a column, per finalsSourceStages: QF1<-(8_1,8_2), QF2<-(8_5,8_6),
  // QF3<-(8_3,8_4), QF4<-(8_7,8_8).
  FINALS_8_1: 1,
  FINALS_8_2: 5,
  FINALS_8_3: 3,
  FINALS_8_4: 7,
  FINALS_8_5: 2,
  FINALS_8_6: 6,
  FINALS_8_7: 4,
  FINALS_8_8: 8,
  FINALS_4_1: 10,
  FINALS_4_2: 11,
  FINALS_4_3: 12,
  FINALS_4_4: 13,
  FINALS_2_1: 15,
  FINALS_2_2: 16,
  FINALS: 18,
  THIRD_PLACE: 19,
};

const FINAL_ORDER_MAP_MOBILE: Record<string, number> = {
  FINALS_16_1: 1,
  FINALS_16_2: 2,
  FINALS_16_3: 3,
  FINALS_16_4: 4,
  FINALS_16_5: 5,
  FINALS_16_6: 6,
  FINALS_16_7: 7,
  FINALS_16_8: 8,
  FINALS_16_9: 9,
  FINALS_16_10: 10,
  FINALS_16_11: 11,
  FINALS_16_12: 12,
  FINALS_16_13: 13,
  FINALS_16_14: 14,
  FINALS_16_15: 15,
  FINALS_16_16: 16,
  FINALS_8_1: 1,
  FINALS_8_2: 2,
  FINALS_8_3: 3,
  FINALS_8_4: 4,
  FINALS_8_5: 5,
  FINALS_8_6: 6,
  FINALS_8_7: 7,
  FINALS_8_8: 8,
  FINALS_4_1: 9,
  FINALS_4_2: 10,
  FINALS_4_3: 11,
  FINALS_4_4: 12,
  FINALS_2_1: 13,
  FINALS_2_2: 14,
  FINALS: 15,
  THIRD_PLACE: 16,
};

// Official FIFA World Cup 2026 knockout linkage. FINALS_16_N is match (72+N),
// FINALS_8_N is match (88+N), FINALS_4_N is (96+N), FINALS_2_N is (100+N).
// The bracket does NOT pair slots sequentially: e.g. R16 match 89 is the winner
// of match 74 vs the winner of match 77. Source: openfootball/worldcup 2026 and
// the 2026 FIFA World Cup knockout-stage bracket.
export const finalsSourceStages: FinalsSourceStageMap = {
  // Round of 16 (89-96)
  FINALS_8_1: { left: "FINALS_16_2", right: "FINALS_16_5", mode: "winner" }, // 89: W74 v W77
  FINALS_8_2: { left: "FINALS_16_1", right: "FINALS_16_3", mode: "winner" }, // 90: W73 v W75
  FINALS_8_3: { left: "FINALS_16_4", right: "FINALS_16_6", mode: "winner" }, // 91: W76 v W78
  FINALS_8_4: { left: "FINALS_16_7", right: "FINALS_16_8", mode: "winner" }, // 92: W79 v W80
  FINALS_8_5: { left: "FINALS_16_11", right: "FINALS_16_12", mode: "winner" }, // 93: W83 v W84
  FINALS_8_6: { left: "FINALS_16_9", right: "FINALS_16_10", mode: "winner" }, // 94: W81 v W82
  FINALS_8_7: { left: "FINALS_16_14", right: "FINALS_16_16", mode: "winner" }, // 95: W86 v W88
  FINALS_8_8: { left: "FINALS_16_13", right: "FINALS_16_15", mode: "winner" }, // 96: W85 v W87
  // Quarterfinals (97-100)
  FINALS_4_1: { left: "FINALS_8_1", right: "FINALS_8_2", mode: "winner" }, // 97: W89 v W90
  FINALS_4_2: { left: "FINALS_8_5", right: "FINALS_8_6", mode: "winner" }, // 98: W93 v W94
  FINALS_4_3: { left: "FINALS_8_3", right: "FINALS_8_4", mode: "winner" }, // 99: W91 v W92
  FINALS_4_4: { left: "FINALS_8_7", right: "FINALS_8_8", mode: "winner" }, // 100: W95 v W96
  // Semifinals (101-102)
  FINALS_2_1: { left: "FINALS_4_1", right: "FINALS_4_2", mode: "winner" }, // 101: W97 v W98
  FINALS_2_2: { left: "FINALS_4_3", right: "FINALS_4_4", mode: "winner" }, // 102: W99 v W100
  // Final (104) and third place (103)
  FINALS: { left: "FINALS_2_1", right: "FINALS_2_2", mode: "winner" }, // 104: W101 v W102
  THIRD_PLACE: { left: "FINALS_2_1", right: "FINALS_2_2", mode: "loser" }, // 103: L101 v L102
};

export type FinalsMatchLike = {
  stage: string;
  countryLeftId?: string;
  countryRightId?: string;
  goalsLeft?: number | null;
  goalsRight?: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
};

export function getFinalsStageGroup(stage: string): FinalsStageGroup | null {
  if (stage === "FINALS" || stage === "THIRD_PLACE") return "FINAL";

  if (stage.startsWith(FINAL_GROUP_PREFIXES.FINALS_16)) return "FINALS_16";
  if (stage.startsWith(FINAL_GROUP_PREFIXES.FINALS_8)) return "FINALS_8";
  if (stage.startsWith(FINAL_GROUP_PREFIXES.FINALS_4)) return "FINALS_4";
  if (stage.startsWith(FINAL_GROUP_PREFIXES.FINALS_2)) return "FINALS_2";

  return null;
}

export function getFinalsStageOrder(stage: string, mobile?: boolean) {
  return (mobile ? FINAL_ORDER_MAP_MOBILE : FINAL_ORDER_MAP)[stage] ?? 0;
}

export const getMatchOrder = getFinalsStageOrder;

export function resolveFinalsMatches<T extends FinalsMatchLike>(
  matches: T[],
  getWinner: (match: T) => string | undefined,
  getLoser: (match: T) => string | undefined
) {
  return matches.reduce((result, match) => {
    const source = finalsSourceStages[match.stage];
    if (!source) {
      return [...result, match];
    }

    const leftSource = result.find((row) => row.stage === source.left);
    const rightSource = result.find((row) => row.stage === source.right);

    const countryLeftId =
      source.mode === "winner"
        ? getWinner(leftSource ?? match)
        : getLoser(leftSource ?? match);
    const countryRightId =
      source.mode === "winner"
        ? getWinner(rightSource ?? match)
        : getLoser(rightSource ?? match);

    return [
      ...result,
      {
        ...match,
        countryLeftId,
        countryRightId,
      },
    ];
  }, [] as T[]);
}
