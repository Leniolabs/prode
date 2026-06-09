import { describe, it, expect } from "vitest";
import { groupMatchLockTime, isGroupMatchLocked } from "@/utils/date";
import { GROUP_MATCHDAY_DEADLINES } from "@/config/matchdays";

// Real WC 2026 fecha boundaries (UTC first kickoffs).
const FECHA_1 = new Date("2026-06-11T19:00:00.000Z");
const FECHA_2 = new Date("2026-06-18T16:00:00.000Z");
const FECHA_3 = new Date("2026-06-24T19:00:00.000Z");

// Representative match dates from the seeded fixture.
const F1_OPENER = new Date("2026-06-11T19:00:00.000Z"); // MEX-RSA, exactly fecha 1 start
const F1_LATE = new Date("2026-06-18T02:00:00.000Z"); // last fecha-1 match
const F2_FIRST = new Date("2026-06-18T16:00:00.000Z"); // first fecha-2 match
const F2_LATE = new Date("2026-06-19T01:00:00.000Z"); // a fecha-2 match a day later
const F3_FIRST = new Date("2026-06-24T19:00:00.000Z");

describe("groupMatchLockTime", () => {
  it("maps a match to the first kickoff of its fecha", () => {
    expect(groupMatchLockTime(F1_LATE, GROUP_MATCHDAY_DEADLINES)).toEqual(FECHA_1);
    expect(groupMatchLockTime(F2_LATE, GROUP_MATCHDAY_DEADLINES)).toEqual(FECHA_2);
    expect(groupMatchLockTime(F3_FIRST, GROUP_MATCHDAY_DEADLINES)).toEqual(FECHA_3);
  });

  it("treats a match starting exactly at a boundary as belonging to that fecha", () => {
    expect(groupMatchLockTime(F2_FIRST, GROUP_MATCHDAY_DEADLINES)).toEqual(FECHA_2);
  });

  it("returns null for a date before the first deadline", () => {
    expect(
      groupMatchLockTime(new Date("2026-06-01T00:00:00.000Z"), GROUP_MATCHDAY_DEADLINES)
    ).toBeNull();
  });
});

describe("isGroupMatchLocked", () => {
  it("keeps a whole fecha open before its first kickoff", () => {
    const justBeforeF2 = new Date("2026-06-18T15:59:00.000Z");
    // A later fecha-2 match (06-19) is still editable because fecha 2 has not started.
    expect(isGroupMatchLocked(F2_LATE, GROUP_MATCHDAY_DEADLINES, justBeforeF2)).toBe(false);
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, justBeforeF2)).toBe(false);
  });

  it("locks the entire fecha at its first kickoff", () => {
    const atF2Kickoff = FECHA_2;
    // Same-fecha later match locks together — no peeking at the opener's result.
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, atF2Kickoff)).toBe(true);
    expect(isGroupMatchLocked(F2_LATE, GROUP_MATCHDAY_DEADLINES, atF2Kickoff)).toBe(true);
  });

  it("leaves later fechas open after an earlier fecha has started", () => {
    const duringF1 = new Date("2026-06-12T00:00:00.000Z");
    expect(isGroupMatchLocked(F1_OPENER, GROUP_MATCHDAY_DEADLINES, duringF1)).toBe(true);
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, duringF1)).toBe(false);
    expect(isGroupMatchLocked(F3_FIRST, GROUP_MATCHDAY_DEADLINES, duringF1)).toBe(false);
  });

  it("locks everything once the last fecha has kicked off", () => {
    const afterF3 = new Date("2026-06-25T00:00:00.000Z");
    expect(isGroupMatchLocked(F1_OPENER, GROUP_MATCHDAY_DEADLINES, afterF3)).toBe(true);
    expect(isGroupMatchLocked(F2_FIRST, GROUP_MATCHDAY_DEADLINES, afterF3)).toBe(true);
    expect(isGroupMatchLocked(F3_FIRST, GROUP_MATCHDAY_DEADLINES, afterF3)).toBe(true);
  });
});
