// Input shapes for the scoring engine.
// These mirror the Prisma-generated fields actually used by the scoring
// functions so callers can pass plain objects without importing the full
// generated client types.

export interface RoomScoreConfig {
  pointsWinner: number;
  pointsGoals: number;
  pointsPenal: number;
}

export interface GroupMatchInput {
  matchId: string;
  goalsLeft: number;
  goalsRight: number;
  match: {
    goalsLeft: number | null;
    goalsRight: number | null;
    filled: boolean;
  };
}

export interface FinalsMatchInput {
  goalsLeft: number;
  goalsRight: number;
  matchId: string;
  match: {
    goalsLeft: number | null;
    goalsRight: number | null;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  };
  countryLeftId: string;
  countryRightId: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}
