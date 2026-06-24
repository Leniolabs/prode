import { describe, expect, it } from "vitest";
import {
  computeGroupStandings,
  rankThirdPlaced,
  resolveRoundOf32,
  R32_SLOTS,
  THIRD_PLACE_COMBINATIONS,
  THIRD_PLACE_SLOT_ORDER,
  GROUPS,
  type Group,
  type GroupMatchResult,
  type TeamStanding,
} from "@/lib/bracket";
import { finalsSourceStages } from "@/utils/finals";

describe("third-place combination table", () => {
  it("has all 495 combinations", () => {
    expect(Object.keys(THIRD_PLACE_COMBINATIONS)).toHaveLength(495);
  });

  it("keys are 8 sorted distinct group letters and values permute them", () => {
    for (const [key, value] of Object.entries(THIRD_PLACE_COMBINATIONS)) {
      expect(key).toHaveLength(8);
      expect([...key].join("")).toBe([...key].sort().join("")); // already sorted
      expect(new Set(key).size).toBe(8);
      expect(value).toHaveLength(8);
      expect([...value].sort().join("")).toBe(key); // value is a permutation of key
    }
  });

  it("matches the published assignment for the all-high-groups combination", () => {
    // Row 1 of the FIFA table: thirds from E,F,G,H,I,J,K,L.
    // Slot order [1A,1B,1D,1E,1G,1I,1K,1L].
    expect(THIRD_PLACE_COMBINATIONS["EFGHIJKL"]).toBe("EJIFHGLK");
  });

  it("never assigns a third-placed team to a slot hosted by its own group", () => {
    // The 8 hosting group winners must never receive their own group's third.
    const hosts = THIRD_PLACE_SLOT_ORDER.map((s) => s.replace("1", ""));
    for (const value of Object.values(THIRD_PLACE_COMBINATIONS)) {
      [...value].forEach((group, i) => {
        expect(group).not.toBe(hosts[i]);
      });
    }
  });
});

describe("computeGroupStandings", () => {
  it("orders by points, then goal difference, then goals scored", () => {
    const matches: GroupMatchResult[] = [
      { countryLeftId: "T1", countryRightId: "T2", goalsLeft: 3, goalsRight: 0 },
      { countryLeftId: "T3", countryRightId: "T4", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "T1", countryRightId: "T3", goalsLeft: 2, goalsRight: 0 },
      { countryLeftId: "T2", countryRightId: "T4", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "T1", countryRightId: "T4", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "T2", countryRightId: "T3", goalsLeft: 0, goalsRight: 0 },
    ];
    const standings = computeGroupStandings("A", matches);
    expect(standings[0].countryId).toBe("T1"); // 9 pts
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3, 4]);
  });

  it("breaks a points/GD/goals tie by head-to-head result", () => {
    // a and b finish identical on points, GD and goals; a won the head-to-head.
    const matches: GroupMatchResult[] = [
      { countryLeftId: "a", countryRightId: "b", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "c", countryRightId: "a", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "a", countryRightId: "d", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "b", countryRightId: "c", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "b", countryRightId: "d", goalsLeft: 1, goalsRight: 0 },
      { countryLeftId: "c", countryRightId: "d", goalsLeft: 0, goalsRight: 0 },
    ];
    const standings = computeGroupStandings("A", matches);
    const a = standings.find((s) => s.countryId === "a")!;
    const b = standings.find((s) => s.countryId === "b")!;
    expect(a.points).toBe(b.points);
    expect(a.goalDifference).toBe(b.goalDifference);
    expect(a.goalsFor).toBe(b.goalsFor);
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(2);
  });
});

function buildStandings(group: Group, thirdPoints: number): TeamStanding[] {
  const mk = (rank: number, points: number): TeamStanding => ({
    countryId: `${group}${rank}`,
    group,
    played: 3,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points,
    rank,
  });
  return [mk(1, 9), mk(2, 6), mk(3, thirdPoints), mk(4, 0)];
}

describe("resolveRoundOf32", () => {
  // Groups E-L get the 8 highest third-placed points, so they qualify.
  const thirdPointsByGroup: Record<Group, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 10,
    K: 11,
    L: 12,
  };
  const standingsByGroup = new Map<Group, TeamStanding[]>(
    GROUPS.map((g) => [g, buildStandings(g, thirdPointsByGroup[g])]),
  );

  const assignments = resolveRoundOf32(standingsByGroup);
  const byStage = new Map(assignments!.map((a) => [a.stage, a]));

  it("ranks the eight best third-placed teams as the qualifiers", () => {
    const thirds = GROUPS.map(
      (g) => standingsByGroup.get(g)!.find((s) => s.rank === 3)!,
    );
    const qualifiers = rankThirdPlaced(thirds)
      .slice(0, 8)
      .map((t) => t.group)
      .sort()
      .join("");
    expect(qualifiers).toBe("EFGHIJKL");
  });

  it("places fixed group positions correctly", () => {
    // Match 73: runner-up A vs runner-up B.
    expect(byStage.get("FINALS_16_1")).toMatchObject({
      homeCountryId: "A2",
      awayCountryId: "B2",
    });
    // Match 88: runner-up D vs runner-up G.
    expect(byStage.get("FINALS_16_16")).toMatchObject({
      homeCountryId: "D2",
      awayCountryId: "G2",
    });
    // Match 86: winner J vs runner-up H.
    expect(byStage.get("FINALS_16_14")).toMatchObject({
      homeCountryId: "J1",
      awayCountryId: "H2",
    });
  });

  it("places third-placed teams via the FIFA table (combination EFGHIJKL)", () => {
    // From row 1: 1A<-3E, 1E<-3F, 1B<-3J.
    // Match 79 (slot 1A): winner A vs third of group E.
    expect(byStage.get("FINALS_16_7")).toMatchObject({
      homeCountryId: "A1",
      awayCountryId: "E3",
    });
    // Match 74 (slot 1E): winner E vs third of group F.
    expect(byStage.get("FINALS_16_2")).toMatchObject({
      homeCountryId: "E1",
      awayCountryId: "F3",
    });
    // Match 85 (slot 1B): winner B vs third of group J.
    expect(byStage.get("FINALS_16_13")).toMatchObject({
      homeCountryId: "B1",
      awayCountryId: "J3",
    });
  });

  it("returns null when a group is incomplete", () => {
    const partial = new Map(standingsByGroup);
    partial.set("A", buildStandings("A", 1).slice(0, 2)); // drop ranks 3,4
    expect(resolveRoundOf32(partial)).toBeNull();
  });

  it("covers all 16 round-of-32 stages exactly once", () => {
    expect(assignments).toHaveLength(16);
    expect(new Set(assignments!.map((a) => a.stage)).size).toBe(16);
    expect(R32_SLOTS).toHaveLength(16);
  });
});

describe("finalsSourceStages official linkage", () => {
  it("matches the FIFA WC 2026 bracket (R16 -> final)", () => {
    // R16 (FINALS_8_N): official pairings of round-of-32 winners.
    expect(finalsSourceStages.FINALS_8_1).toMatchObject({ left: "FINALS_16_2", right: "FINALS_16_5" }); // 89: W74 v W77
    expect(finalsSourceStages.FINALS_8_2).toMatchObject({ left: "FINALS_16_1", right: "FINALS_16_3" }); // 90: W73 v W75
    expect(finalsSourceStages.FINALS_8_8).toMatchObject({ left: "FINALS_16_13", right: "FINALS_16_15" }); // 96: W85 v W87
    // QF (FINALS_4_N).
    expect(finalsSourceStages.FINALS_4_1).toMatchObject({ left: "FINALS_8_1", right: "FINALS_8_2" }); // 97: W89 v W90
    // SF (FINALS_2_N).
    expect(finalsSourceStages.FINALS_2_1).toMatchObject({ left: "FINALS_4_1", right: "FINALS_4_2" }); // 101: W97 v W98
    // Final and third place draw from the two semifinals.
    expect(finalsSourceStages.FINALS).toMatchObject({ left: "FINALS_2_1", right: "FINALS_2_2", mode: "winner" });
    expect(finalsSourceStages.THIRD_PLACE).toMatchObject({ left: "FINALS_2_1", right: "FINALS_2_2", mode: "loser" });
  });
});
