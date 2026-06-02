/**
 * Finals (knockout) scoring logic.
 *
 * Knockout matches can be decided in regulation or via a penalty shootout.
 * Penalty goals do NOT count as regular goals — a 1-1 draw resolved on
 * penalties is still recorded as 1-1 in the goals columns.
 *
 * Point tiers (highest to lowest):
 *   pointsPenal  — exact draw score AND exact penalty score
 *   pointsGoals  — exact regulation score (no draw) OR exact draw goals +
 *                  correct penalty winner side (but not exact penalties)
 *   pointsWinner — correct overall winner by any path
 *   0            — wrong outcome
 */

import { Match, ProdeRoom, ProdeUserFinalsMatch } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Status badges (used by UI, not by leaderboard SQL)
// ---------------------------------------------------------------------------

/**
 * Whether the user predicted the correct countries for a finals match.
 *
 * Returns:
 *   "MATCH"  — both country slots match exactly
 *   "WRONG"  — at least one country differs
 *   ""       — match countries not set yet (both null)
 */
export const matchCountriesMatchStatus = (
  match: Pick<Match, "id" | "countryLeftId" | "countryRightId">,
  userMatch: Pick<
    ProdeUserFinalsMatch,
    "matchId" | "countryLeftId" | "countryRightId"
  >
): "MATCH" | "WRONG" | "" => {
  if (!match.countryLeftId && !match.countryRightId) return "";
  if (
    match.countryLeftId === userMatch.countryLeftId &&
    match.countryRightId === userMatch.countryRightId
  )
    return "MATCH";

  return "WRONG";
};

/**
 * Result status badge for a finals match (considering countries).
 *
 * Returns:
 *   "GOALS_MATCH"  — exact score, correct countries
 *   "WINNER_MATCH" — correct outcome direction, correct countries
 *   "WRONG"        — wrong outcome or wrong countries
 *   undefined      — data incomplete (null goals)
 */
export const matchFinalResultStatus = (
  match: Pick<
    Match,
    "id" | "goalsLeft" | "goalsRight" | "countryLeftId" | "countryRightId"
  >,
  userMatch: Pick<
    ProdeUserFinalsMatch,
    "matchId" | "goalsLeft" | "goalsRight" | "countryLeftId" | "countryRightId"
  >
): "GOALS_MATCH" | "WINNER_MATCH" | "WRONG" | undefined => {
  if (
    userMatch.goalsLeft === null ||
    match.goalsLeft === null ||
    userMatch.goalsRight === null ||
    match.goalsRight === null
  )
    return;

  if (
    match.countryLeftId !== userMatch.countryLeftId ||
    match.countryRightId !== userMatch.countryRightId
  )
    return "WRONG";

  if (
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight
  )
    return "GOALS_MATCH";
  else if (
    (match.goalsLeft >= match.goalsRight &&
      userMatch.goalsLeft >= userMatch.goalsRight) ||
    (match.goalsLeft <= match.goalsRight &&
      userMatch.goalsLeft <= userMatch.goalsRight)
  ) {
    return "WINNER_MATCH";
  } else {
    return "WRONG";
  }
};

// ---------------------------------------------------------------------------
// Winner/loser helpers (used by admin UI and bracket rendering)
// ---------------------------------------------------------------------------

/** Return the winning country ID for a group-stage match (no draw winner). */
export function getAdminMatchWinner(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
}): string | undefined {
  if (
    (!match.goalsLeft && match.goalsLeft !== 0) ||
    (!match.goalsRight && match.goalsRight !== 0) ||
    !match.countryLeftId ||
    !match.countryRightId
  )
    return undefined;

  if (match.goalsLeft === match.goalsRight) {
    return undefined;
  }

  return match.goalsLeft > match.goalsRight
    ? match.countryLeftId
    : match.countryRightId;
}

/** Return the winning country ID from a user's finals prediction. */
export function getFinalsMatchWinner(match: {
  userGoalsLeft?: number | null;
  userGoalsRight?: number | null;
  userCountryLeftId?: string;
  userCountryRightId?: string;
  userPenaltisLeft?: number | null;
  userPenaltisRight?: number | null;
}): string | undefined {
  if (
    (!match.userGoalsLeft && match.userGoalsLeft !== 0) ||
    (!match.userGoalsRight && match.userGoalsRight !== 0) ||
    !match.userCountryLeftId ||
    !match.userCountryRightId
  )
    return undefined;

  if (match.userGoalsLeft === match.userGoalsRight) {
    if (
      (match.userPenaltisLeft || match.userPenaltisLeft === 0) &&
      (match.userPenaltisRight || match.userPenaltisRight === 0)
    ) {
      if (match.userPenaltisLeft > match.userPenaltisRight)
        return match.userCountryLeftId;
      else if (match.userPenaltisLeft < match.userPenaltisRight)
        return match.userCountryRightId;
    }
    return undefined;
  }

  return match.userGoalsLeft > match.userGoalsRight
    ? match.userCountryLeftId
    : match.userCountryRightId;
}

/** Return the losing country ID from a user's finals prediction. */
export function getFinalsMatchLooser(match: {
  userGoalsLeft?: number | null;
  userGoalsRight?: number | null;
  userCountryLeftId?: string;
  userCountryRightId?: string;
  userPenaltisLeft?: number | null;
  userPenaltisRight?: number | null;
}): string | undefined {
  if (
    (!match.userGoalsLeft && match.userGoalsLeft !== 0) ||
    (!match.userGoalsRight && match.userGoalsRight !== 0) ||
    !match.userCountryLeftId ||
    !match.userCountryRightId
  )
    return undefined;

  if (match.userGoalsLeft === match.userGoalsRight) {
    if (
      (match.userPenaltisLeft || match.userPenaltisLeft === 0) &&
      (match.userPenaltisRight || match.userPenaltisRight === 0)
    ) {
      if (match.userPenaltisLeft < match.userPenaltisRight)
        return match.userCountryLeftId;
      else if (match.userPenaltisLeft > match.userPenaltisRight)
        return match.userCountryRightId;
    }
    return undefined;
  }

  return match.userGoalsLeft < match.userGoalsRight
    ? match.userCountryLeftId
    : match.userCountryRightId;
}

/** Return the winning country ID from an actual finals match result. */
export function getAdminFinalsMatchWinner(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}): string | undefined {
  if (
    (!match.goalsLeft && match.goalsLeft !== 0) ||
    (!match.goalsRight && match.goalsRight !== 0) ||
    !match.countryLeftId ||
    !match.countryRightId
  )
    return undefined;

  if (match.goalsLeft === match.goalsRight) {
    if (
      (match.penaltisLeft || match.penaltisLeft === 0) &&
      (match.penaltisRight || match.penaltisRight === 0)
    )
      if (match.penaltisLeft > match.penaltisRight) return match.countryLeftId;
      else if (match.penaltisLeft < match.penaltisRight)
        return match.countryRightId;
    return undefined;
  }

  return match.goalsLeft > match.goalsRight
    ? match.countryLeftId
    : match.countryRightId;
}

/** Return the losing country ID from an actual finals match result. */
export function getAdminFinalsMatchLooser(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}): string | undefined {
  if (
    (!match.goalsLeft && match.goalsLeft !== 0) ||
    (!match.goalsRight && match.goalsRight !== 0) ||
    !match.countryLeftId ||
    !match.countryRightId
  )
    return undefined;

  if (match.goalsLeft === match.goalsRight) {
    if (
      (match.penaltisLeft || match.penaltisLeft === 0) &&
      (match.penaltisRight || match.penaltisRight === 0)
    ) {
      if (match.penaltisLeft < match.penaltisRight) return match.countryLeftId;
      else if (match.penaltisLeft > match.penaltisRight)
        return match.countryRightId;
    }
    return undefined;
  }

  return match.goalsLeft < match.goalsRight
    ? match.countryLeftId
    : match.countryRightId;
}

// ---------------------------------------------------------------------------
// Point computation (canonical source of truth — SQL must agree with this)
// ---------------------------------------------------------------------------

/**
 * Compute points for a single finals match prediction.
 *
 * This is the authoritative TS implementation. The SQL CASE expressions in
 * `utils/raw.ts` (`getSubqueryFinals`) must produce identical results.
 *
 * Scoring rules:
 *   1. Exact draw goals AND exact penalty score → pointsPenal
 *   2. Exact regulation score (not a draw) → pointsGoals
 *   3. Exact draw goals + correct penalty winner side (not exact) → pointsGoals
 *   4. Correct overall winner by any path → pointsWinner
 *   5. Wrong outcome → 0
 */
export function finalMatchPoints(
  room: Pick<ProdeRoom, "pointsWinner" | "pointsGoals" | "pointsPenal">,
  userMatch: {
    goalsLeft: number;
    goalsRight: number;
    matchId: string;
    match: Pick<
      Match,
      "goalsLeft" | "goalsRight" | "penaltisLeft" | "penaltisRight"
    >;
    countryLeftId: string;
    countryRightId: string;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }
): number {
  const { match } = userMatch;

  if (
    (!match.goalsLeft && match.goalsLeft !== 0) ||
    (!match.goalsRight && match.goalsRight !== 0)
  )
    //no esta completo
    return 0;

  if (
    match.goalsLeft === match.goalsRight &&
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight &&
    match.penaltisLeft === userMatch.penaltisLeft &&
    match.penaltisRight === userMatch.penaltisRight
  )
    //empate y resultado perfecto
    return room.pointsPenal;

  if (
    match.goalsLeft !== match.goalsRight &&
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight
  )
    //no es empate pero resultado perfecto
    return room.pointsGoals;

  if (match.goalsLeft > match.goalsRight) {
    //gana left en goles
    if (userMatch.goalsLeft > userMatch.goalsRight) {
      //predice que gana left
      return room.pointsWinner;
    }

    if (
      userMatch.goalsLeft === userMatch.goalsRight &&
      (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
      (userMatch.penaltisRight || userMatch.penaltisRight === 0)
    ) {
      //predice que empatan
      if (userMatch.penaltisLeft > userMatch.penaltisRight) {
        //predice que gana left en penales
        return room.pointsWinner;
      }
    }

    return 0;
  }

  if (match.goalsLeft < match.goalsRight) {
    //gana right en goles
    if (userMatch.goalsLeft < userMatch.goalsRight) {
      //predice que gana right
      return room.pointsWinner;
    }

    if (
      userMatch.goalsLeft === userMatch.goalsRight &&
      (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
      (userMatch.penaltisRight || userMatch.penaltisRight === 0)
    ) {
      //predice que empatan
      if (userMatch.penaltisLeft < userMatch.penaltisRight) {
        //predice que gana right en penales
        return room.pointsWinner;
      }
    }

    return 0;
  }

  if (
    match.goalsLeft === match.goalsRight &&
    (match.penaltisLeft || match.penaltisLeft === 0) &&
    (match.penaltisRight || match.penaltisRight === 0)
  ) {
    //empate

    if (match.penaltisLeft > match.penaltisRight) {
      //gana left en penales

      if (
        userMatch.goalsLeft === userMatch.goalsRight &&
        (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
        (userMatch.penaltisRight || userMatch.penaltisRight === 0)
      ) {
        //predice que empatan
        if (userMatch.penaltisLeft > userMatch.penaltisRight) {
          //predice que gana left en penales

          if (
            userMatch.goalsLeft === match.goalsLeft &&
            userMatch.goalsRight === match.goalsRight
          ) {
            //predice el ganador sin penales exactos
            //pero los goles estan ok
            return room.pointsGoals;
          }

          return room.pointsWinner;
        }
      }

      if (userMatch.goalsLeft > userMatch.goalsRight) {
        //predice que gana left
        return room.pointsWinner;
      }

      return 0;
    }

    if (match.penaltisLeft < match.penaltisRight) {
      //gana right en paneles

      if (
        userMatch.goalsLeft === userMatch.goalsRight &&
        (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
        (userMatch.penaltisRight || userMatch.penaltisRight === 0)
      ) {
        //predice que empatan
        if (userMatch.penaltisLeft < userMatch.penaltisRight) {
          //predice que gana right en penales

          if (
            userMatch.goalsLeft === match.goalsLeft &&
            userMatch.goalsRight === match.goalsRight
          ) {
            //predice el ganador sin penales exactos
            //pero los goles estan ok
            return room.pointsGoals;
          }

          return room.pointsWinner;
        }
      }

      if (userMatch.goalsLeft < userMatch.goalsRight) {
        //predice que gana right
        return room.pointsWinner;
      }

      return 0;
    }

    return 0;
  }

  return 0;
}

/**
 * Compute total points scored across an array of finals match predictions.
 */
export const computeFinalMatchPoints = (
  room: Pick<ProdeRoom, "pointsWinner" | "pointsGoals" | "pointsPenal">,
  finalMatches: {
    goalsLeft: number;
    goalsRight: number;
    matchId: string;
    match: Pick<
      Match,
      "goalsLeft" | "goalsRight" | "penaltisLeft" | "penaltisRight"
    >;
    countryLeftId: string;
    countryRightId: string;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }[]
): number => {
  return finalMatches.reduce((result, userMatch) => {
    if (!userMatch) return result;
    return result + finalMatchPoints(room, userMatch);
  }, 0);
};
