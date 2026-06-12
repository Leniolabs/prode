import { describe, expect, it } from "vitest";
import { buildScoreboardDateRange, normalizeEvent } from "@/lib/espn";
import type { EspnEvent } from "@/lib/espn";

function buildEvent(overrides: Partial<EspnEvent> = {}): EspnEvent {
  return {
    id: "633789",
    date: "2026-06-11T19:00:00.000Z",
    status: {
      type: {
        name: "STATUS_FULL_TIME",
        completed: true,
        state: "post",
        description: "Full Time",
        detail: "FT",
      },
    },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: "6",
            team: { id: "448", abbreviation: "ENG", displayName: "England" },
          },
          {
            homeAway: "away",
            score: "2",
            team: { id: "469", abbreviation: "IRN", displayName: "Iran" },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("normalizeEvent", () => {
  it("maps a completed ESPN scoreboard event into the shared result shape", () => {
    expect(normalizeEvent(buildEvent())).toEqual({
      id: 633789,
      kickoffUtc: "2026-06-11T19:00:00.000Z",
      homeTeamCode: "ENG",
      awayTeamCode: "IRN",
      homeScore: 6,
      awayScore: 2,
      homePen: null,
      awayPen: null,
      status: "Full Time",
      phase: "FT",
    });
  });

  it("rejects non-final events", () => {
    expect(
      normalizeEvent(
        buildEvent({
          status: { type: { name: "STATUS_SCHEDULED", completed: false, state: "pre" } },
        }),
      ),
    ).toBeNull();
  });
});

describe("buildScoreboardDateRange", () => {
  it("builds one ESPN date range from the pending match dates, padded a day each side", () => {
    expect(
      buildScoreboardDateRange([
        new Date("2026-06-27T02:00:00.000Z"),
        new Date("2026-06-11T19:00:00.000Z"),
        new Date("2026-06-13T01:00:00.000Z"),
      ]),
    ).toBe("20260610-20260628");
  });
});