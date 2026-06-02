/**
 * Group-stage scoring logic.
 *
 * Group matches never have penalties; the only outcomes are:
 *   - Exact score (pointsGoals)
 *   - Correct winner / draw outcome (pointsWinner)
 *   - Wrong outcome (0 points)
 */

import { Match, ProdeRoom } from "@/generated/prisma";
import { RoomConfig, UserGroupPrediction } from "./types";

/**
 * Compute the result status badge for a single group-stage match.
 *
 * Returns:
 *   "GOALS_MATCH"  — user predicted the exact score
 *   "WINNER_MATCH" — user predicted the correct winner or draw
 *   "WRONG"        — wrong outcome
 *   undefined      — match not yet filled or goals are null
 */
export const matchResultStatus = (
  match: Pick<Match, "goalsLeft" | "goalsRight" | "filled">,
  userMatch: Pick<Match, "goalsLeft" | "goalsRight">
): "GOALS_MATCH" | "WINNER_MATCH" | "WRONG" | undefined => {
  if (
    !match.filled ||
    userMatch.goalsLeft === null ||
    match.goalsLeft === null ||
    userMatch.goalsRight === null ||
    match.goalsRight === null
  )
    return;

  if (
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight
  )
    return "GOALS_MATCH";
  else if (
    match.goalsLeft === match.goalsRight &&
    userMatch.goalsLeft === userMatch.goalsRight
  ) {
    return "WINNER_MATCH";
  } else if (
    (match.goalsLeft > match.goalsRight &&
      userMatch.goalsLeft > userMatch.goalsRight) ||
    (match.goalsLeft < match.goalsRight &&
      userMatch.goalsLeft < userMatch.goalsRight)
  ) {
    return "WINNER_MATCH";
  } else {
    return "WRONG";
  }
};

/**
 * Compute total points scored across an array of group-stage user predictions.
 *
 * This is the canonical TS implementation used as source of truth for the SQL
 * scoring in `utils/raw.ts`.
 */
export const computeGroupMatchPoints = (
  room: Pick<ProdeRoom, "pointsWinner" | "pointsGoals" | "pointsPenal"> &
    Partial<RoomConfig>,
  groupMatches: {
    matchId: string;
    goalsLeft: number;
    goalsRight: number;
    match: Pick<Match, "goalsLeft" | "goalsRight">;
  }[]
): number => {
  return groupMatches.reduce((result, userMatch) => {
    const match = userMatch.match;
    if (!userMatch) return result;
    if (
      userMatch.goalsLeft === null ||
      match.goalsLeft === null ||
      userMatch.goalsRight === null ||
      match.goalsRight === null
    )
      return result;

    if (
      userMatch.goalsLeft === match.goalsLeft &&
      userMatch.goalsRight === match.goalsRight
    )
      return result + room.pointsGoals;
    else if (
      match.goalsLeft === match.goalsRight &&
      userMatch.goalsLeft === userMatch.goalsRight
    )
      return result + room.pointsWinner;
    else if (
      (match.goalsLeft > match.goalsRight &&
        userMatch.goalsLeft > userMatch.goalsRight) ||
      (match.goalsLeft < match.goalsRight &&
        userMatch.goalsLeft < userMatch.goalsRight)
    )
      return result + room.pointsWinner;

    return result;
  }, 0);
};
