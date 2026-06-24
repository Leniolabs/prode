import { prisma } from "@/lib/prisma";
import { R32_SLOTS } from "@/lib/bracket";
import { fetchScoreboardRange, type EspnEvent } from "./client";
import { buildScoreboardDateRange } from "./sync";
import { alignByKickoff } from "./reconcile";

const R32_STAGES = R32_SLOTS.map((slot) => slot.stage as never);

export type EspnResolvedEvent = {
  kickoffUtc: string;
  homeExternalId: number | null;
  awayExternalId: number | null;
};

export type R32SlotRow = {
  stage: string;
  date: Date;
  countryLeftId: string | null;
  countryRightId: string | null;
};

export type SlotWrite = {
  stage: string;
  countryLeftId?: string;
  countryRightId?: string;
};

export type PopulateResult = { written: number };

function externalId(raw: string | undefined): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export function toResolvedEvent(event: EspnEvent): EspnResolvedEvent {
  const competitors = event.competitions[0]?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  return {
    kickoffUtc: event.date,
    homeExternalId: externalId(home?.team.id),
    awayExternalId: externalId(away?.team.id),
  };
}

// Pure: given our round-of-32 slot rows, ESPN's resolved events, and a map from
// ESPN team id to our Country id, returns the forward-only writes that apply
// ESPN's resolved teams to each slot. ESPN is the source of truth, and it
// resolves the two sides independently — a clinched team (e.g. a group winner)
// appears while its opponent is still a "3rd place" or "runner-up" placeholder.
// So each side is written on its own as soon as ESPN has it; the other side
// stays untouched until ESPN publishes it. ESPN's home maps to our left, away
// to our right (we trust the official orientation). Group-position placeholders
// carry ids that match no Country, so they map to undefined and never overwrite
// a slot. Forward-only: a side is written only when it differs from what is
// stored.
export function resolveEspnR32Writes(
  slots: R32SlotRow[],
  events: EspnResolvedEvent[],
  countryIdByExternalId: Map<number, string>,
): SlotWrite[] {
  const countryId = (id: number | null): string | undefined =>
    id === null ? undefined : countryIdByExternalId.get(id);

  const writes: SlotWrite[] = [];
  for (const { slot, event } of alignByKickoff(slots, events)) {
    const leftId = countryId(event.homeExternalId);
    const rightId = countryId(event.awayExternalId);

    const write: SlotWrite = { stage: slot.stage };
    if (leftId && leftId !== slot.countryLeftId) write.countryLeftId = leftId;
    if (rightId && rightId !== slot.countryRightId) write.countryRightId = rightId;
    if (write.countryLeftId || write.countryRightId) writes.push(write);
  }

  return writes;
}

// Applies ESPN's official round-of-32 bracket to our match rows. ESPN resolves a
// slot the moment a team clinches its bracket position (and owns the
// third-place tiebreakers we cannot derive from scores), so this is the source
// of truth: it overrides whatever our own seeder computed. Forward-only and
// idempotent — it no-ops on slots ESPN has not published and self-fetches the
// round-of-32 window, so it is safe to run on every sync tick.
export async function populateRoundOf32FromEspn(): Promise<PopulateResult> {
  const rows = await prisma.match.findMany({
    where: { stage: { in: R32_STAGES } },
    select: {
      id: true,
      prodeId: true,
      stage: true,
      date: true,
      countryLeftId: true,
      countryRightId: true,
    },
    orderBy: { date: "asc" },
  });
  if (rows.length === 0) return { written: 0 };

  const dateRange = buildScoreboardDateRange(rows.map((r) => r.date));
  if (!dateRange) return { written: 0 };

  const events = (await fetchScoreboardRange(dateRange)).map(toResolvedEvent);

  const externalIds = new Set<number>();
  for (const event of events) {
    if (event.homeExternalId !== null) externalIds.add(event.homeExternalId);
    if (event.awayExternalId !== null) externalIds.add(event.awayExternalId);
  }
  if (externalIds.size === 0) return { written: 0 };

  const countries = await prisma.country.findMany({
    where: { externalId: { in: Array.from(externalIds) } },
    select: { id: true, externalId: true },
  });
  const countryIdByExternalId = new Map<number, string>();
  for (const country of countries) {
    if (country.externalId !== null) {
      countryIdByExternalId.set(country.externalId, country.id);
    }
  }
  if (countryIdByExternalId.size === 0) return { written: 0 };

  // Each prode owns its own round-of-32 rows; align and write per prode so the
  // same ESPN event fills the matching slot in every prode independently.
  const byProde = new Map<string, (R32SlotRow & { id: string })[]>();
  for (const row of rows) {
    const list = byProde.get(row.prodeId) ?? [];
    list.push({
      id: row.id,
      stage: row.stage as string,
      date: row.date,
      countryLeftId: row.countryLeftId,
      countryRightId: row.countryRightId,
    });
    byProde.set(row.prodeId, list);
  }

  let written = 0;
  for (const slots of Array.from(byProde.values())) {
    const idByStage = new Map(slots.map((s) => [s.stage, s.id] as const));
    for (const write of resolveEspnR32Writes(slots, events, countryIdByExternalId)) {
      const id = idByStage.get(write.stage);
      if (!id) continue;

      const data: { countryLeftId?: string; countryRightId?: string } = {};
      if (write.countryLeftId) data.countryLeftId = write.countryLeftId;
      if (write.countryRightId) data.countryRightId = write.countryRightId;

      await prisma.match.update({ where: { id }, data });
      written++;
    }
  }

  return { written };
}
