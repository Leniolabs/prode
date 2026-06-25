import { prisma } from "@/lib/prisma";
import { R32_SLOTS } from "@/lib/bracket";
import { fetchScoreboardRange, type EspnEvent } from "./client";
import { buildScoreboardDateRange } from "./sync";

// Stages whose participant is decided by the third-place table. These are the
// only round-of-32 slots exposed to FIFA's best-thirds ranking and its
// fair-play / drawing-of-lots tiebreakers, which we cannot derive from scores.
// A divergence here is the expected edge case; a divergence on any other slot
// signals a bug or a data inconsistency.
const THIRD_PLACE_STAGES = new Set(
  R32_SLOTS.filter(
    (slot) => slot.home.kind === "thirdPlace" || slot.away.kind === "thirdPlace",
  ).map((slot) => slot.stage as string),
);

const R32_STAGES = R32_SLOTS.map((slot) => slot.stage as never);

// Two seeded slots can never legitimately map to ESPN events more than this far
// apart in time. The official schedule is the same source on both sides, so the
// real delta is ~0; the window only guards against matching adjacent same-day
// fixtures (the tightest real gap is ~90 minutes).
const MATCH_TOLERANCE_MS = 75 * 60 * 1000;

export type SeededSlot = {
  stage: string;
  date: Date;
  leftCode: string | null;
  rightCode: string | null;
};

export type R32Event = {
  kickoffUtc: string;
  homeCode: string | null;
  awayCode: string | null;
};

export type SlotDivergence = {
  stage: string;
  thirdPlaceSlot: boolean;
  expected: [string, string];
  actual: [string, string];
};

export type ReconcileResult = {
  matched: number;
  divergences: SlotDivergence[];
  unmatched: string[];
};

function pair(a: string, b: string): string {
  return [a, b].map((c) => c.toUpperCase()).sort().join("|");
}

// Pairs each slot with the nearest unused event whose kickoff falls within the
// tolerance window. Slots are processed in kickoff order so nearest-unused
// assignment is deterministic. Callers pre-filter the slots and events they
// care about; this helper only owns the time-based matching, which the
// reconcile (detective) and populate (writer) paths must share so they never
// drift apart. The tightest real gap between two seeded fixtures is ~90 minutes.
export function alignByKickoff<
  S extends { date: Date },
  E extends { kickoffUtc: string },
>(slots: S[], events: E[], toleranceMs = MATCH_TOLERANCE_MS): { slot: S; event: E }[] {
  const candidates = events
    .map((event) => ({ time: new Date(event.kickoffUtc).getTime(), event }))
    .filter((c) => Number.isFinite(c.time));

  const used = new Set<number>();
  const pairs: { slot: S; event: E }[] = [];

  const ordered = [...slots].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const slot of ordered) {
    const slotTime = slot.date.getTime();
    let bestIndex = -1;
    let bestDelta = Infinity;
    candidates.forEach((candidate, index) => {
      if (used.has(index)) return;
      const delta = Math.abs(candidate.time - slotTime);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    });

    if (bestIndex === -1 || bestDelta > toleranceMs) continue;
    used.add(bestIndex);
    pairs.push({ slot, event: candidates[bestIndex].event });
  }

  return pairs;
}

// Pure comparison: aligns each seeded round-of-32 slot to the ESPN event at the
// same kickoff time, then compares the two team codes as an unordered set
// (home/away orientation may differ between sources). Only slots we have
// already seeded (both codes present) and events ESPN has populated (both codes
// present) are compared; everything else is reported as unmatched, never as a
// divergence, so a not-yet-published bracket produces no false positives.
export function reconcileSlots(
  slots: SeededSlot[],
  events: R32Event[],
): ReconcileResult {
  const seeded = slots.filter((s) => s.leftCode && s.rightCode);
  const published = events.filter((e) => e.homeCode && e.awayCode);

  const pairs = alignByKickoff(seeded, published);
  const pairedStages = new Set(pairs.map((p) => p.slot.stage));

  const result: ReconcileResult = { matched: 0, divergences: [], unmatched: [] };

  for (const slot of seeded) {
    if (!pairedStages.has(slot.stage)) result.unmatched.push(slot.stage);
  }

  for (const { slot, event } of pairs) {
    result.matched++;
    if (pair(slot.leftCode!, slot.rightCode!) !== pair(event.homeCode!, event.awayCode!)) {
      result.divergences.push({
        stage: slot.stage,
        thirdPlaceSlot: THIRD_PLACE_STAGES.has(slot.stage),
        expected: [slot.leftCode!, slot.rightCode!],
        actual: [event.homeCode!, event.awayCode!],
      });
    }
  }

  return result;
}

function toR32Event(event: EspnEvent): R32Event {
  const competitors = event.competitions[0]?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const code = (raw: string | undefined) => {
    const value = raw?.trim().toUpperCase();
    return value ? value : null;
  };
  return {
    kickoffUtc: event.date,
    homeCode: code(home?.team.abbreviation),
    awayCode: code(away?.team.abbreviation),
  };
}

// Validates our computed round-of-32 assignment against FIFA's official bracket
// as published by ESPN. Detective control only: it logs divergences, it does
// not mutate the bracket. No-op (and no network call) until at least one slot
// has been seeded, so it stays silent through the group stage.
export async function reconcileRoundOf32(): Promise<ReconcileResult> {
  const rows = await prisma.match.findMany({
    where: { stage: { in: R32_STAGES } },
    select: {
      stage: true,
      date: true,
      countryLeft: { select: { code: true } },
      countryRight: { select: { code: true } },
    },
    orderBy: { date: "asc" },
  });

  const slots: SeededSlot[] = rows.map((row) => ({
    stage: row.stage as string,
    date: row.date,
    leftCode: row.countryLeft?.code ?? null,
    rightCode: row.countryRight?.code ?? null,
  }));

  // Nothing assigned yet -> skip entirely, including the ESPN fetch.
  if (!slots.some((s) => s.leftCode && s.rightCode)) {
    return { matched: 0, divergences: [], unmatched: [] };
  }

  const dateRange = buildScoreboardDateRange(slots.map((s) => s.date));
  if (!dateRange) {
    return { matched: 0, divergences: [], unmatched: [] };
  }

  const events = await fetchScoreboardRange(dateRange);
  const result = reconcileSlots(slots, events.map(toR32Event));

  for (const divergence of result.divergences) {
    const tag = divergence.thirdPlaceSlot
      ? "third-place tiebreaker"
      : "DETERMINISTIC SLOT (investigate)";
    console.warn(
      `[r32 reconcile] ${divergence.stage} (${tag}): computed ` +
        `${divergence.expected.join(" v ")}, ESPN has ${divergence.actual.join(" v ")}`,
    );
  }

  return result;
}
