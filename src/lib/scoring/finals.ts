import { Match, ProdeRoom, ProdeUserFinalsMatch } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Status helpers (knockout stage)
// ---------------------------------------------------------------------------

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

  const actualLeft = match.goalsLeft > match.goalsRight;
  const actualRight = match.goalsLeft < match.goalsRight;
  const actualDraw = match.goalsLeft === match.goalsRight;
  const userLeft = userMatch.goalsLeft > userMatch.goalsRight;
  const userRight = userMatch.goalsLeft < userMatch.goalsRight;
  const userDraw = userMatch.goalsLeft === userMatch.goalsRight;

  if (
    (actualLeft && userLeft) ||
    (actualRight && userRight) ||
    (actualDraw && userDraw)
  )
    return "WINNER_MATCH";

  return "WRONG";
};

// ---------------------------------------------------------------------------
// Winner / loser helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Point arithmetic (knockout stage)
// ---------------------------------------------------------------------------

export function finalMatchPoints(
  room: ProdeRoom,
  userMatch: {
    goalsLeft: number;
    goalsRight: number;
    matchId: string;
    match: Match;
    countryLeftId: string;
    countryRightId: string;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }
) {
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
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight &&
    (match.penaltisLeft || match.penaltisLeft === 0) &&
    (match.penaltisRight || match.penaltisRight === 0)
  )
    //empate resuelto por penales: goles exactos, pero penales distintos
    return room.pointsGoals;

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
      // el usuario DEBE haber predicho empate con penales para sumar puntos;
      // si predijo victoria directa (sin penales) no acierta al ganador por penales → 0
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
            //goles exactos pero penales no exactos
            return room.pointsGoals;
          }

          return room.pointsWinner;
        }
      }

      return 0;
    }

    if (match.penaltisLeft < match.penaltisRight) {
      //gana right en penales
      // el usuario DEBE haber predicho empate con penales para sumar puntos
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
            //goles exactos pero penales no exactos
            return room.pointsGoals;
          }

          return room.pointsWinner;
        }
      }

      return 0;
    }

    return 0;
  }

  return 0;
}

export const computeFinalMatchPoints = (
  room: ProdeRoom,
  finalMatches: {
    goalsLeft: number;
    goalsRight: number;
    matchId: string;
    match: Match;
    countryLeftId: string;
    countryRightId: string;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }[]
) => {
  return finalMatches.reduce((result, userMatch) => {
    if (!userMatch) return result;
    return result + finalMatchPoints(room, userMatch);
  }, 0);
};
