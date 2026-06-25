import { describe, expect, it } from "vitest";
import {
  resolveEspnR32Writes,
  toResolvedEvent,
  type EspnResolvedEvent,
  type R32SlotRow,
} from "@/lib/espn";
import type { EspnEvent } from "@/lib/espn";

const slot = (
  stage: string,
  iso: string,
  countryLeftId: string | null,
  countryRightId: string | null,
): R32SlotRow => ({ stage, date: new Date(iso), countryLeftId, countryRightId });

const event = (
  iso: string,
  homeExternalId: number | null,
  awayExternalId: number | null,
): EspnResolvedEvent => ({ kickoffUtc: iso, homeExternalId, awayExternalId });

// ESPN team id -> our Country id. 481/203/660/202 are real WC teams; the 5900s
// are ESPN's group-position placeholders, deliberately absent from the map.
const COUNTRY_BY_EXTERNAL = new Map<number, string>([
  [481, "c-ger"],
  [203, "c-mex"],
  [660, "c-usa"],
  [202, "c-arg"],
]);

describe("resolveEspnR32Writes", () => {
  it("writes both sides when ESPN has resolved a slot we have not seeded", () => {
    const slots = [slot("FINALS_16_7", "2026-07-01T22:00:00.000Z", null, null)];
    const events = [event("2026-07-01T22:00:00.000Z", 203, 481)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([
      { stage: "FINALS_16_7", countryLeftId: "c-mex", countryRightId: "c-ger" },
    ]);
  });

  it("maps ESPN home to our left and away to our right", () => {
    const slots = [slot("FINALS_16_14", "2026-07-03T20:00:00.000Z", null, null)];
    const events = [event("2026-07-03T20:00:00.000Z", 202, 660)];
    const [write] = resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL);
    expect(write.countryLeftId).toBe("c-arg");
    expect(write.countryRightId).toBe("c-usa");
  });

  it("ignores group-position placeholders (ids not mapped to a country)", () => {
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", null, null)];
    const events = [event("2026-06-28T19:00:00.000Z", 5926, 5924)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([]);
  });

  it("writes the resolved side and leaves the placeholder side untouched", () => {
    // The real-world case: a clinched team (home) vs a "3rd place" placeholder.
    const slots = [slot("FINALS_16_7", "2026-07-01T01:00:00.000Z", null, null)];
    const events = [event("2026-07-01T01:00:00.000Z", 203, 131541)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([
      { stage: "FINALS_16_7", countryLeftId: "c-mex" },
    ]);
  });

  it("writes only the away side when the home side is a placeholder", () => {
    const slots = [slot("FINALS_16_7", "2026-07-01T01:00:00.000Z", null, null)];
    const events = [event("2026-07-01T01:00:00.000Z", 5926, 481)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([
      { stage: "FINALS_16_7", countryRightId: "c-ger" },
    ]);
  });

  it("is forward-only: emits nothing when stored teams already match ESPN", () => {
    const slots = [slot("FINALS_16_7", "2026-07-01T22:00:00.000Z", "c-mex", "c-ger")];
    const events = [event("2026-07-01T22:00:00.000Z", 203, 481)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([]);
  });

  it("overrides only the side that differs from what is stored", () => {
    const slots = [slot("FINALS_16_7", "2026-07-01T22:00:00.000Z", "c-mex", "c-usa")];
    const events = [event("2026-07-01T22:00:00.000Z", 203, 481)];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([
      { stage: "FINALS_16_7", countryRightId: "c-ger" },
    ]);
  });

  it("aligns adjacent same-day fixtures to the correct event by kickoff time", () => {
    const slots = [
      slot("FINALS_16_2", "2026-06-29T20:30:00.000Z", null, null),
      slot("FINALS_16_3", "2026-06-29T22:00:00.000Z", null, null),
    ];
    const events = [
      event("2026-06-29T22:00:00.000Z", 660, 202),
      event("2026-06-29T20:30:00.000Z", 481, 203),
    ];
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([
      { stage: "FINALS_16_2", countryLeftId: "c-ger", countryRightId: "c-mex" },
      { stage: "FINALS_16_3", countryLeftId: "c-usa", countryRightId: "c-arg" },
    ]);
  });

  it("leaves a slot untouched when no event falls within the time tolerance", () => {
    const slots = [slot("FINALS_16_7", "2026-07-01T22:00:00.000Z", null, null)];
    const events = [event("2026-07-02T01:00:00.000Z", 203, 481)]; // 3h away
    expect(resolveEspnR32Writes(slots, events, COUNTRY_BY_EXTERNAL)).toEqual([]);
  });
});

describe("toResolvedEvent", () => {
  const baseEvent = (homeId: string, awayId: string): EspnEvent => ({
    id: "1",
    date: "2026-07-01T22:00:00.000Z",
    status: { type: { name: "STATUS_SCHEDULED", completed: false } },
    competitions: [
      {
        competitors: [
          { homeAway: "home", team: { id: homeId, abbreviation: "MEX" } },
          { homeAway: "away", team: { id: awayId, abbreviation: "GER" } },
        ],
      },
    ],
  });

  it("extracts numeric team ids by home/away", () => {
    expect(toResolvedEvent(baseEvent("203", "481"))).toEqual({
      kickoffUtc: "2026-07-01T22:00:00.000Z",
      homeExternalId: 203,
      awayExternalId: 481,
    });
  });

  it("yields null for a non-numeric team id", () => {
    const resolved = toResolvedEvent(baseEvent("203", "TBD"));
    expect(resolved.homeExternalId).toBe(203);
    expect(resolved.awayExternalId).toBeNull();
  });
});
