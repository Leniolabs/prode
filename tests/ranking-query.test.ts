import { describe, expect, it } from "vitest";

import { getFullRankingQuery, getRankingQuery } from "@/utils/raw";

describe("ranking query position numbering", () => {
  const room = {
    id: "room-test",
    pointsWinner: 1,
    pointsGoals: 3,
    pointsPenal: 5,
  } as any;

  it("uses dense ranking for the leaderboard query", () => {
    const query = getRankingQuery(room);
    const sql = query.strings.join("");

    expect(sql).toContain("DENSE_RANK () OVER");
    expect(sql).not.toContain("\n  RANK () OVER");
  });

  it("uses dense ranking for the full leaderboard query", () => {
    const query = getFullRankingQuery(room);
    const sql = query.strings.join("");

    expect(sql).toContain("DENSE_RANK () OVER");
    expect(sql).not.toContain("\n  RANK () OVER");
  });
});
