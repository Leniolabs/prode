/**
 * Input shapes for the scoring engine.
 *
 * These are intentionally minimal — they capture only the fields each scoring
 * function actually reads. Callers may pass richer Prisma model instances;
 * TypeScript will accept them because the Pick is structurally compatible.
 */

/** The actual match result as stored in the DB. */
export type MatchResult = {
  goalsLeft: number | null;
  goalsRight: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
  filled?: boolean;
};

/** A user's prediction for a finals (knockout) match. */
export type UserFinalPrediction = {
  goalsLeft: number;
  goalsRight: number;
  matchId: string;
  match: MatchResult;
  countryLeftId: string;
  countryRightId: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
};

/** A user's prediction for a group-stage match (bundled with the actual match). */
export type UserGroupPrediction = {
  matchId: string;
  goalsLeft: number;
  goalsRight: number;
  match: MatchResult;
};

/** The three scoring weights configured per room. */
export type RoomConfig = {
  pointsWinner: number;
  pointsGoals: number;
  pointsPenal: number;
};
