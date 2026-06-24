import { describe, expect, it } from "vitest";
import { reconcileSlots, type R32Event, type SeededSlot } from "@/lib/espn";

const slot = (
  stage: string,
  iso: string,
  leftCode: string | null,
  rightCode: string | null,
): SeededSlot => ({ stage, date: new Date(iso), leftCode, rightCode });

const event = (
  iso: string,
  homeCode: string | null,
  awayCode: string | null,
): R32Event => ({ kickoffUtc: iso, homeCode, awayCode });

describe("reconcileSlots", () => {
  it("reports no divergence when teams match, ignoring home/away orientation", () => {
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", "USA", "CAN")];
    const events = [event("2026-06-28T19:00:00.000Z", "CAN", "USA")];
    const result = reconcileSlots(slots, events);
    expect(result.matched).toBe(1);
    expect(result.divergences).toEqual([]);
    expect(result.unmatched).toEqual([]);
  });

  it("flags a third-place slot divergence as the expected tiebreaker case", () => {
    // FINALS_16_7 (match 79, slot 1A) is fed by the third-place table.
    const slots = [slot("FINALS_16_7", "2026-06-30T22:00:00.000Z", "MEX", "BRA")];
    const events = [event("2026-06-30T22:00:00.000Z", "MEX", "ARG")];
    const result = reconcileSlots(slots, events);
    expect(result.matched).toBe(1);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0]).toMatchObject({
      stage: "FINALS_16_7",
      thirdPlaceSlot: true,
      expected: ["MEX", "BRA"],
      actual: ["MEX", "ARG"],
    });
  });

  it("flags a deterministic slot divergence as a bug, not a tiebreaker", () => {
    // FINALS_16_1 (match 73, 2A v 2B) has no third-place input.
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", "USA", "CAN")];
    const events = [event("2026-06-28T19:00:00.000Z", "USA", "GER")];
    const result = reconcileSlots(slots, events);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].thirdPlaceSlot).toBe(false);
  });

  it("treats a not-yet-published ESPN slot as unmatched, never a divergence", () => {
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", "USA", "CAN")];
    const events = [event("2026-06-28T19:00:00.000Z", null, null)];
    const result = reconcileSlots(slots, events);
    expect(result.matched).toBe(0);
    expect(result.divergences).toEqual([]);
    expect(result.unmatched).toEqual(["FINALS_16_1"]);
  });

  it("ignores slots we have not seeded yet", () => {
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", null, null)];
    const events = [event("2026-06-28T19:00:00.000Z", "USA", "CAN")];
    const result = reconcileSlots(slots, events);
    expect(result).toEqual({ matched: 0, divergences: [], unmatched: [] });
  });

  it("aligns adjacent same-day fixtures to the correct event by kickoff time", () => {
    const slots = [
      slot("FINALS_16_2", "2026-06-29T20:30:00.000Z", "E1", "F3"),
      slot("FINALS_16_3", "2026-06-29T22:00:00.000Z", "F1", "C2"),
    ];
    const events = [
      event("2026-06-29T22:00:00.000Z", "F1", "C2"),
      event("2026-06-29T20:30:00.000Z", "E1", "F3"),
    ];
    const result = reconcileSlots(slots, events);
    expect(result.matched).toBe(2);
    expect(result.divergences).toEqual([]);
  });

  it("leaves a slot unmatched when no event falls within the time tolerance", () => {
    const slots = [slot("FINALS_16_1", "2026-06-28T19:00:00.000Z", "USA", "CAN")];
    const events = [event("2026-06-28T21:30:00.000Z", "USA", "CAN")]; // 2.5h away
    const result = reconcileSlots(slots, events);
    expect(result.matched).toBe(0);
    expect(result.unmatched).toEqual(["FINALS_16_1"]);
  });
});
