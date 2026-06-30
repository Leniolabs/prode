import { Match } from "@/generated/prisma";
import {
  matchFinalResultStatus,
  matchResultStatus,
} from "@/lib/scoring";

export type RankingHistogramBucket = {
  label: string;
  value: number;
  count: number;
};

export type RankingStats = {
  points: RankingHistogramBucket[];
  groupOutcomeHits: RankingHistogramBucket[];
  exactFinalGoals: RankingHistogramBucket[];
  viewer?: {
    points: number;
    groupOutcomeHits: number;
    exactFinalGoals: number;
  };
};

type RankingRow = {
  id: string;
  points: number;
};

type GroupPrediction = {
  userProdeId: string;
  goalsLeft: number;
  goalsRight: number;
  match: Pick<Match, "goalsLeft" | "goalsRight" | "filled">;
};

type FinalPrediction = {
  userProdeId: string;
  goalsLeft: number;
  goalsRight: number;
  penaltisLeft: number | null;
  penaltisRight: number | null;
  countryLeftId: string;
  countryRightId: string;
  match: Pick<
    Match,
    "id" | "goalsLeft" | "goalsRight" | "countryLeftId" | "countryRightId" | "filled"
  >;
};

function choosePointBinSize(values: number[]) {
  if (values.length === 0) return 1;

  const max = Math.max(...values);
  if (max <= 20) return 1;
  if (max <= 40) return 2;
  if (max <= 100) return 5;
  return 10;
}

function formatBucketLabel(value: number, binSize: number) {
  if (binSize === 1) return `${value}`;

  const end = value + binSize - 1;
  return `${value}-${end}`;
}

function buildHistogram(values: number[], binSize: number): RankingHistogramBucket[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const start = Math.floor(min / binSize) * binSize;
  const end = Math.floor(max / binSize) * binSize;
  const counts = new Map<number, number>();

  for (const value of values) {
    const bucket = Math.floor(value / binSize) * binSize;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const buckets: RankingHistogramBucket[] = [];
  for (let bucket = start; bucket <= end; bucket += binSize) {
    buckets.push({
      label: formatBucketLabel(bucket, binSize),
      value: bucket,
      count: counts.get(bucket) ?? 0,
    });
  }

  return buckets;
}

export function buildRankingStats(
  rankingRows: RankingRow[],
  groupPredictions: GroupPrediction[],
  finalPredictions: FinalPrediction[],
  viewerUserProdeId?: string,
): RankingStats {
  const userStats = new Map<
    string,
    { points: number; groupOutcomeHits: number; exactFinalGoals: number }
  >();

  for (const row of rankingRows) {
    userStats.set(row.id, {
      points: row.points,
      groupOutcomeHits: 0,
      exactFinalGoals: 0,
    });
  }

  const registerPredictionResult = (
    userProdeId: string,
    outcome: "WINNER_MATCH" | "GOALS_MATCH" | "WRONG" | undefined,
  ) => {
    const current = userStats.get(userProdeId);
    if (!current || !outcome) return;

    if (outcome === "WINNER_MATCH") {
      current.groupOutcomeHits += 1;
    }

    if (outcome === "GOALS_MATCH") {
      current.exactFinalGoals += 1;
    }
  };

  for (const prediction of groupPredictions) {
    registerPredictionResult(
      prediction.userProdeId,
      matchResultStatus(prediction.match, prediction),
    );
  }

  for (const prediction of finalPredictions) {
    registerPredictionResult(
      prediction.userProdeId,
      matchFinalResultStatus(prediction.match, prediction),
    );
  }

  const points = rankingRows.map((row) => row.points);
  const groupOutcomeHits = [...userStats.values()].map((row) => row.groupOutcomeHits);
  const exactFinalGoals = [...userStats.values()].map((row) => row.exactFinalGoals);

  return {
    points: buildHistogram(points, choosePointBinSize(points)),
    groupOutcomeHits: buildHistogram(groupOutcomeHits, 1),
    exactFinalGoals: buildHistogram(exactFinalGoals, 1),
    viewer: viewerUserProdeId ? userStats.get(viewerUserProdeId) : undefined,
  };
}
