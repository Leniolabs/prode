import {
  Match,
  ProdeUserFinalsMatch,
  ProdeUserGroupMatch,
} from "@prisma/client";

export const matchCountriesMatchStatus = (
  match: Pick<Match, "id" | "countryLeftId" | "countryRightId">,
  userMatch: Pick<
    ProdeUserFinalsMatch,
    "matchId" | "countryLeftId" | "countryRightId"
  >
) => {
  if (!match.countryLeftId && !match.countryRightId) return "";
  if (
    match.countryLeftId === userMatch.countryLeftId &&
    match.countryRightId === userMatch.countryRightId
  )
    return "MATCH";

  return "WRONG";
};

export const matchFinalResultStatus = (
  match: Pick<
    Match,
    "id" | "goalsLeft" | "goalsRight" | "countryLeftId" | "countryRightId"
  >,
  userMatch: Pick<
    ProdeUserFinalsMatch,
    "matchId" | "goalsLeft" | "goalsRight" | "countryLeftId" | "countryRightId"
  >
) => {
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

export function getAdminMatchWinner(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
}) {
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

export function getFinalsMatchWinner(match: {
  userGoalsLeft?: number | null;
  userGoalsRight?: number | null;
  userCountryLeftId?: string;
  userCountryRightId?: string;
  userPenaltisLeft?: number | null;
  userPenaltisRight?: number | null;
}) {
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

export function getFinalsMatchLooser(match: {
  userGoalsLeft?: number | null;
  userGoalsRight?: number | null;
  userCountryLeftId?: string;
  userCountryRightId?: string;
  userPenaltisLeft?: number | null;
  userPenaltisRight?: number | null;
}) {
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

export function getAdminFinalsMatchWinner(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}) {
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

export function getAdminFinalsMatchLooser(match: {
  goalsLeft?: number | null;
  goalsRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}) {
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
