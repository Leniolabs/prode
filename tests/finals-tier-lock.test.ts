import { describe, it, expect } from "vitest";
import { finalsTierLockTime, isFinalsMatchLocked } from "@/utils/date";
import { FINALS_TIER_DEADLINES } from "@/config/matchdays";

// Real WC 2026 finals tier first-kickoffs (UTC), one per knockout round.
const T_16 = new Date("2026-06-28T19:00:00.000Z"); // Round of 32
const T_8 = new Date("2026-07-04T17:00:00.000Z"); // Round of 16
const T_4 = new Date("2026-07-09T20:00:00.000Z"); // Quarterfinals
const T_2 = new Date("2026-07-14T19:00:00.000Z"); // Semifinals
const T_FINAL = new Date("2026-07-18T21:00:00.000Z"); // Third place + final

describe("finalsTierLockTime", () => {
  it("maps every match of a tier to its tier's first kickoff", () => {
    expect(finalsTierLockTime("FINALS_16_1", FINALS_TIER_DEADLINES)).toEqual(T_16);
    expect(finalsTierLockTime("FINALS_16_16", FINALS_TIER_DEADLINES)).toEqual(T_16);
    expect(finalsTierLockTime("FINALS_8_5", FINALS_TIER_DEADLINES)).toEqual(T_8);
    expect(finalsTierLockTime("FINALS_4_3", FINALS_TIER_DEADLINES)).toEqual(T_4);
    expect(finalsTierLockTime("FINALS_2_2", FINALS_TIER_DEADLINES)).toEqual(T_2);
  });

  it("groups FINALS and THIRD_PLACE into the same FINAL tier", () => {
    expect(finalsTierLockTime("FINALS", FINALS_TIER_DEADLINES)).toEqual(T_FINAL);
    expect(finalsTierLockTime("THIRD_PLACE", FINALS_TIER_DEADLINES)).toEqual(T_FINAL);
  });

  it("returns null for a group-stage (non-finals) stage", () => {
    expect(finalsTierLockTime("GROUP_A", FINALS_TIER_DEADLINES)).toBeNull();
  });
});

describe("isFinalsMatchLocked", () => {
  it("keeps a whole tier open before its first kickoff", () => {
    const justBefore8 = new Date("2026-07-04T16:59:00.000Z");
    expect(isFinalsMatchLocked("FINALS_8_1", FINALS_TIER_DEADLINES, justBefore8)).toBe(false);
    expect(isFinalsMatchLocked("FINALS_8_8", FINALS_TIER_DEADLINES, justBefore8)).toBe(false);
  });

  it("locks the entire tier at its first kickoff", () => {
    // Same-tier later match locks together — no peeking at the opener's result.
    expect(isFinalsMatchLocked("FINALS_8_1", FINALS_TIER_DEADLINES, T_8)).toBe(true);
    expect(isFinalsMatchLocked("FINALS_8_8", FINALS_TIER_DEADLINES, T_8)).toBe(true);
  });

  it("leaves later tiers open after an earlier tier has started", () => {
    const during16 = new Date("2026-06-29T00:00:00.000Z");
    expect(isFinalsMatchLocked("FINALS_16_1", FINALS_TIER_DEADLINES, during16)).toBe(true);
    expect(isFinalsMatchLocked("FINALS_8_1", FINALS_TIER_DEADLINES, during16)).toBe(false);
    expect(isFinalsMatchLocked("FINALS_4_1", FINALS_TIER_DEADLINES, during16)).toBe(false);
    expect(isFinalsMatchLocked("FINALS", FINALS_TIER_DEADLINES, during16)).toBe(false);
  });

  it("locks everything once the final tier has kicked off", () => {
    const afterFinalKickoff = new Date("2026-07-18T22:00:00.000Z");
    expect(isFinalsMatchLocked("FINALS_16_1", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
    expect(isFinalsMatchLocked("FINALS_8_1", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
    expect(isFinalsMatchLocked("FINALS_4_1", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
    expect(isFinalsMatchLocked("FINALS_2_1", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
    expect(isFinalsMatchLocked("FINALS", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
    expect(isFinalsMatchLocked("THIRD_PLACE", FINALS_TIER_DEADLINES, afterFinalKickoff)).toBe(true);
  });

  it("treats a non-finals stage as never locked by this rule", () => {
    expect(isFinalsMatchLocked("GROUP_A", FINALS_TIER_DEADLINES, T_FINAL)).toBe(false);
  });
});
