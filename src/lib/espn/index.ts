export { syncMatchResults, buildScoreboardDateRange, normalizeEvent } from "./sync";
export { fetchScoreboard, fetchTeams, isFinal } from "./client";
export type { EspnEvent, EspnTeam, EspnCompetitor } from "./client";
export { reconcileRoundOf32, reconcileSlots, alignByKickoff } from "./reconcile";
export type {
  ReconcileResult,
  SlotDivergence,
  SeededSlot,
  R32Event,
} from "./reconcile";
export {
  populateRoundOf32FromEspn,
  resolveEspnR32Writes,
  toResolvedEvent,
} from "./populate";
export type {
  EspnResolvedEvent,
  R32SlotRow,
  SlotWrite,
  PopulateResult,
} from "./populate";
export { linkCountryExternalIds } from "./link-countries";
export type { LinkResult } from "./link-countries";
