import { describe, expect, it } from "vitest";
import {
  findPendingMatch,
  shouldSyncApiMatch,
  type PendingMatch,
} from "@/lib/api-sports";
import type { ApiSportsMatch } from "@/lib/api-sports";

function buildApiMatch(overrides: Partial<ApiSportsMatch> = {}): ApiSportsMatch {
  return {
    id: 101,
    kickoffUtc: "2026-06-11T19:00:00.000Z",
    homeTeamCode: "MEX",
    awayTeamCode: "RSA",
    homeScore: 3,
    awayScore: 1,
    homePen: null,
    awayPen: null,
    status: "completed",
    phase: "FT",
    ...overrides,
  };
}

function buildPendingMatch(overrides: Partial<PendingMatch> = {}): PendingMatch {
  return {
    id: "match-1",
    apiFixtureId: null,
    date: new Date("2026-06-11T19:00:00.000Z"),
    filled: false,
    goalsLeft: null,
    goalsRight: null,
    penaltisLeft: null,
    penaltisRight: null,
    countryLeftCode: "MEX",
    countryRightCode: "RSA",
    ...overrides,
  };
}

describe("shouldSyncApiMatch", () => {
  it("accepts past matches with both scores present", () => {
    const now = new Date("2026-06-12T00:00:00.000Z");
    expect(shouldSyncApiMatch(buildApiMatch(), now)).toBe(true);
  });

  it("rejects future matches and matches with null scores", () => {
    const now = new Date("2026-06-11T18:00:00.000Z");
    expect(shouldSyncApiMatch(buildApiMatch(), now)).toBe(false);
    expect(
      shouldSyncApiMatch(buildApiMatch({ homeScore: null, awayScore: null }), new Date("2026-06-12T00:00:00.000Z")),
    ).toBe(false);
  });
});

describe("findPendingMatch", () => {
  it("matches by fixture id first", () => {
    const resolution = findPendingMatch(
      buildApiMatch({ id: 77 }),
      [buildPendingMatch({ apiFixtureId: 77, countryLeftCode: "AAA", countryRightCode: "BBB" })],
      new Set<string>(),
    );

    expect(resolution?.match.apiFixtureId).toBe(77);
  });

  it("matches by team codes and kickoff when fixture id is missing", () => {
    const resolution = findPendingMatch(
      buildApiMatch(),
      [buildPendingMatch()],
      new Set<string>(),
    );

    expect(resolution?.match.id).toBe("match-1");
    expect(resolution?.leftIsHome).toBe(true);
  });

  it("detects swapped home and away orientation", () => {
    const resolution = findPendingMatch(
      buildApiMatch(),
      [buildPendingMatch({ countryLeftCode: "RSA", countryRightCode: "MEX" })],
      new Set<string>(),
    );

    expect(resolution?.match.id).toBe("match-1");
    expect(resolution?.leftIsHome).toBe(false);
  });

  it("prefers the nearest kickoff when more than one match shares the same teams", () => {
    const resolution = findPendingMatch(
      buildApiMatch({ kickoffUtc: "2026-07-01T19:00:00.000Z" }),
      [
        buildPendingMatch({ id: "far", date: new Date("2026-06-30T08:00:00.000Z") }),
        buildPendingMatch({ id: "near", date: new Date("2026-07-01T18:30:00.000Z") }),
      ],
      new Set<string>(),
    );

    expect(resolution?.match.id).toBe("near");
  });
});