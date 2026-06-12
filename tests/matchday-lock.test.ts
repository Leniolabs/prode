import { describe, it, expect } from "vitest";
import { groupMatchLockTime, isGroupMatchLocked } from "@/utils/date";
import { GROUP_MATCHDAY_DEADLINES } from "@/config/matchdays";

// Representative group-match kickoffs from the seeded fixture (UTC).
const F1_OPENER = new Date("2026-06-11T19:00:00.000Z"); // MEX-RSA, first group match
const F1_LATE = new Date("2026-06-18T02:00:00.000Z"); // last fecha-1 match
const F2_FIRST = new Date("2026-06-18T16:00:00.000Z"); // first fecha-2 match
const F3_FIRST = new Date("2026-06-24T19:00:00.000Z"); // first fecha-3 match

describe("groupMatchLockTime", () => {
  it("locks every group match at its own kickoff", () => {
    expect(groupMatchLockTime(F1_OPENER, GROUP_MATCHDAY_DEADLINES)).toEqual(F1_OPENER);
    expect(groupMatchLockTime(F1_LATE, GROUP_MATCHDAY_DEADLINES)).toEqual(F1_LATE);
    expect(groupMatchLockTime(F2_FIRST, GROUP_MATCHDAY_DEADLINES)).toEqual(F2_FIRST);
    expect(groupMatchLockTime(F3_FIRST, GROUP_MATCHDAY_DEADLINES)).toEqual(F3_FIRST);
  });

  it("returns null for a date before the first deadline", () => {
    expect(
      groupMatchLockTime(new Date("2026-06-01T00:00:00.000Z"), GROUP_MATCHDAY_DEADLINES)
    ).toBeNull();
  });
});

describe("isGroupMatchLocked", () => {
  it("keeps a match open until its kickoff", () => {
    const before = new Date("2026-06-18T15:59:00.000Z");
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, before)).toBe(false);
  });

  it("locks a match at its kickoff", () => {
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, F2_FIRST)).toBe(true);
  });

  it("locks each match independently, not as a fecha block", () => {
    // The opener has started, but a later same-fecha match stays open until its
    // own kickoff.
    const afterOpener = new Date("2026-06-11T19:30:00.000Z");
    expect(isGroupMatchLocked(F1_OPENER, GROUP_MATCHDAY_DEADLINES, afterOpener)).toBe(true);
    expect(isGroupMatchLocked(F1_LATE, GROUP_MATCHDAY_DEADLINES, afterOpener)).toBe(false);

    // The later match locks exactly at its own kickoff.
    expect(isGroupMatchLocked(F1_LATE, GROUP_MATCHDAY_DEADLINES, F1_LATE)).toBe(true);
    const justBefore = new Date("2026-06-18T01:59:00.000Z");
    expect(isGroupMatchLocked(F1_LATE, GROUP_MATCHDAY_DEADLINES, justBefore)).toBe(false);
  });

  it("locks everything once the last group match has kicked off", () => {
    const afterAll = new Date("2026-06-25T00:00:00.000Z");
    expect(isGroupMatchLocked(F1_OPENER, GROUP_MATCHDAY_DEADLINES, afterAll)).toBe(true);
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, afterAll)).toBe(true);
    expect(isGroupMatchLocked(F3_FIRST, GROUP_MATCHDAY_DEADLINES, afterAll)).toBe(true);
  });
});
