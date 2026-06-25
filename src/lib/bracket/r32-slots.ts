import type { R32Slot } from "./types";

// Round-of-32 slot definitions for FIFA World Cup 2026 (matches 73-88), keyed by
// our internal Stage. Home/away participants are group positions; third-placed
// away sides are resolved through the THIRD_PLACE_COMBINATIONS table.
// Source: openfootball/worldcup 2026 (cup_finals.txt), cross-checked against the
// FIFA regulations Annex C third-place table.
export const R32_SLOTS: R32Slot[] = [
  { stage: "FINALS_16_1" as R32Slot["stage"], home: { kind: "runnerUp", group: "A" }, away: { kind: "runnerUp", group: "B" } }, // 73: 2A v 2B
  { stage: "FINALS_16_2" as R32Slot["stage"], home: { kind: "winner", group: "E" }, away: { kind: "thirdPlace", slot: "1E" } }, // 74: 1E v 3rd
  { stage: "FINALS_16_3" as R32Slot["stage"], home: { kind: "winner", group: "F" }, away: { kind: "runnerUp", group: "C" } }, // 75: 1F v 2C
  { stage: "FINALS_16_4" as R32Slot["stage"], home: { kind: "winner", group: "C" }, away: { kind: "runnerUp", group: "F" } }, // 76: 1C v 2F
  { stage: "FINALS_16_5" as R32Slot["stage"], home: { kind: "winner", group: "I" }, away: { kind: "thirdPlace", slot: "1I" } }, // 77: 1I v 3rd
  { stage: "FINALS_16_6" as R32Slot["stage"], home: { kind: "runnerUp", group: "E" }, away: { kind: "runnerUp", group: "I" } }, // 78: 2E v 2I
  { stage: "FINALS_16_7" as R32Slot["stage"], home: { kind: "winner", group: "A" }, away: { kind: "thirdPlace", slot: "1A" } }, // 79: 1A v 3rd
  { stage: "FINALS_16_8" as R32Slot["stage"], home: { kind: "winner", group: "L" }, away: { kind: "thirdPlace", slot: "1L" } }, // 80: 1L v 3rd
  { stage: "FINALS_16_9" as R32Slot["stage"], home: { kind: "winner", group: "D" }, away: { kind: "thirdPlace", slot: "1D" } }, // 81: 1D v 3rd
  { stage: "FINALS_16_10" as R32Slot["stage"], home: { kind: "winner", group: "G" }, away: { kind: "thirdPlace", slot: "1G" } }, // 82: 1G v 3rd
  { stage: "FINALS_16_11" as R32Slot["stage"], home: { kind: "runnerUp", group: "K" }, away: { kind: "runnerUp", group: "L" } }, // 83: 2K v 2L
  { stage: "FINALS_16_12" as R32Slot["stage"], home: { kind: "winner", group: "H" }, away: { kind: "runnerUp", group: "J" } }, // 84: 1H v 2J
  { stage: "FINALS_16_13" as R32Slot["stage"], home: { kind: "winner", group: "B" }, away: { kind: "thirdPlace", slot: "1B" } }, // 85: 1B v 3rd
  { stage: "FINALS_16_14" as R32Slot["stage"], home: { kind: "winner", group: "J" }, away: { kind: "runnerUp", group: "H" } }, // 86: 1J v 2H
  { stage: "FINALS_16_15" as R32Slot["stage"], home: { kind: "winner", group: "K" }, away: { kind: "thirdPlace", slot: "1K" } }, // 87: 1K v 3rd
  { stage: "FINALS_16_16" as R32Slot["stage"], home: { kind: "runnerUp", group: "D" }, away: { kind: "runnerUp", group: "G" } }, // 88: 2D v 2G
];
