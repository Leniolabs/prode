import { describe, it, expect } from "vitest";
import { finalsMatchLockTime, isFinalsMatchLocked } from "@/utils/date";

// A couple of real WC 2026 finals kickoffs (UTC).
const R32_OPENER = new Date("2026-06-28T19:00:00.000Z"); // first Round of 32 match
const R32_LATER = new Date("2026-06-29T23:00:00.000Z"); // a later Round of 32 match
const FINAL = new Date("2026-07-19T19:00:00.000Z"); // the final

describe("finalsMatchLockTime", () => {
  it("is the match's own kickoff", () => {
    expect(finalsMatchLockTime(R32_OPENER)).toEqual(R32_OPENER);
    expect(finalsMatchLockTime(FINAL)).toEqual(FINAL);
  });
});

describe("isFinalsMatchLocked", () => {
  it("keeps a match open before its own kickoff", () => {
    const justBefore = new Date("2026-06-28T18:59:00.000Z");
    expect(isFinalsMatchLocked(R32_OPENER, justBefore)).toBe(false);
  });

  it("locks a match at its own kickoff", () => {
    expect(isFinalsMatchLocked(R32_OPENER, R32_OPENER)).toBe(true);
  });

  it("locks each match independently, not as a tier block", () => {
    // After the opener kicks off but before a later same-round match starts,
    // the opener is locked while the later match stays editable.
    const between = new Date("2026-06-29T00:00:00.000Z");
    expect(isFinalsMatchLocked(R32_OPENER, between)).toBe(true);
    expect(isFinalsMatchLocked(R32_LATER, between)).toBe(false);
  });
});
