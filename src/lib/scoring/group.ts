import { Match, ProdeRoom } from "@prisma/client";

// ---------------------------------------------------------------------------
// Status helpers (group stage)
// ---------------------------------------------------------------------------

export const matchResultStatus = (
  match: Pick<Match, "goalsLeft" | "goalsRight" | "filled">,
  userMatch: Pick<Match, "goalsLeft" | "goalsRight">
) => {
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

// ---------------------------------------------------------------------------
// Point arithmetic (group stage)
// ---------------------------------------------------------------------------

export const computeGroupMatchPoints = (
  room: ProdeRoom,
  groupMatches: {
    matchId: string;
    goalsLeft: number;
    goalsRight: number;
    match: Match;
  }[]
) => {
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
