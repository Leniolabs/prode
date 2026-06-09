import { Match, ProdeRoom, User, UserProde } from "@/generated/prisma";
import { prisma } from "../lib";
import { matchCountriesMatchStatus, matchFinalResultStatus } from "./points";
import { isGroupMatchLocked } from "./date";
import { GROUP_MATCHDAY_DEADLINES } from "@/config/matchdays";
export {
  computeGroupMatchPoints,
  computeFinalMatchPoints,
  finalMatchPoints,
} from "@/lib/scoring";
import {
  getFullRankingQuery,
  getRankingQuery,
  getUserFullRankingQuery,
  getUserRankingQuery,
} from "./raw";

export async function prodeEnded() {
  const prode = await prisma.prode.findFirst({
    select: {
      stage: true,
      prodeEnd: true,
    },
  });

  const endDate = prode?.prodeEnd;
  if (!endDate) return false;
  endDate.setHours(endDate.getHours() + 3);
  return endDate <= new Date();
}

export async function finalsStarted() {
  const prode = await prisma.prode.findFirst({
    select: {
      stage: true,
    },
  });
  return prode?.stage === "FINALS";
}

function isDeadlineReached(deadline: Date) {
  return deadline.getTime() <= Date.now();
}

type ProdeRoomWithDeadlines = ProdeRoom & {
  prode: {
    groupSubmissionsEnd: Date;
    finalsSubmissionsEnd: Date;
  };
};

export function finalsSubmissionsEnded(room: {
  prode: {
    finalsSubmissionsEnd: Date;
  };
}) {
  return isDeadlineReached(room.prode.finalsSubmissionsEnd);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: email, blocked: false },
  });
}

export async function getUserProdeById(userProdeId: string) {
  return prisma.userProde.findUnique({
    where: {
      id: userProdeId,
    },
    include: {
      user: true,
      prodeRoom: {
        include: {
          prode: true,
        },
      },
    },
  });
}

export async function getUserByUserProdeId(userProdeId: string) {
  return prisma.user.findFirst({
    where: {
      userProdes: {
        some: {
          id: userProdeId,
        },
      },
      blocked: false,
    },
  });
}

export async function isUserBlocked(email: string) {
  return prisma.user.findFirst({
    where: { email: email, blocked: true },
  });
}

export async function countUsersInProdeRoom(id: string) {
  return prisma.userProde.count({
    where: {
      prodeRoomId: id,
    },
  });
}

export async function getProdeRoom(id: string) {
  return prisma.prodeRoom.findUnique({
    where: {
      id,
    },
    include: {
      prode: true,
    },
  });
}

export async function getUserProde(room: ProdeRoom, user: User) {
  return prisma.userProde.findFirst({
    where: {
      prodeRoomId: room.id,
      userId: user.id,
    },
    include: {
      matches: true,
      user: true,
    },
  });
}

export async function getUserTemplateProde(user: User) {
  return prisma.userProde.findFirst({
    where: {
      prodeRoomId: null,
      template: true,
      userId: user.id,
    },
    include: {
      matches: true,
      finalsMatches: true,
      user: true,
    },
  });
}

export async function isUserRegisteredToRoom(room: ProdeRoom, user: User) {
  const prode = await prisma.userProde.findFirst({
    where: {
      prodeRoomId: room.id,
      userId: user.id,
    },
  });
  return !!prode;
}

export async function userHasTemplateProde(user: User) {
  const prode = await prisma.prode.findFirst({});
  if (!prode) return false;

  return !!(await prisma.userProde.findFirst({
    where: {
      prodeId: prode.id,
      prodeRoomId: null,
      template: false,
      userId: user.id,
    },
  }));
}

export async function createTemplateUserProde(user: User) {
  const prode = await prisma.prode.findFirst({});
  if (!prode) return;

  return prisma.userProde.create({
    data: {
      prodeId: prode.id,
      userId: user.id,
      template: true,
      prodeRoomId: null,
      created: new Date(),
    },
  });
}

export async function registerUserToRoom(room: ProdeRoom, user: User) {
  if (await isUserRegisteredToRoom(room, user)) return;

  const userProde = await prisma.userProde.create({
    data: {
      prodeId: room.prodeId,
      userId: user.id,
      prodeRoomId: room.id,
      created: new Date(),
    },
  });

  const templateGroupMatches = await getUserTemplateGroupMatches(user);
  const templateFinalsMatches = (
    await getUserTemplateFinalMatches(user)
  ).filter(
    (match) =>
      new Date(match.date) > new Date() &&
      match.userGoalsLeft &&
      match.userGoalsRight &&
      match.userCountryLeftId &&
      match.userCountryRightId,
  );

  await prisma.$transaction([
    prisma.prodeUserGroupMatch.createMany({
      data: templateGroupMatches
        .filter(
          (match) =>
            new Date(match.date) > new Date() &&
            match.userGoalsLeft &&
            match.userGoalsRight,
        )
        .map((match) => ({
          matchId: match.id,
          goalsLeft: match.userGoalsLeft,
          goalsRight: match.userGoalsRight,
          userProdeId: userProde.id,
        })),
    }),
    prisma.prodeUserFinalsMatch.createMany({
      data: templateFinalsMatches.map((match) => ({
        userProdeId: userProde.id,
        matchId: match.id,
        goalsLeft: match.userGoalsLeft,
        goalsRight: match.userGoalsRight,
        penaltisLeft: match.userPenaltisLeft,
        penaltisRight: match.userPenaltisRight,
        countryLeftId: match.userCountryLeftId || "",
        countryRightId: match.userCountryRightId || "",
      })),
    }),
  ]);

  return userProde;
}

export async function getUserFinalMatches(
  room: ProdeRoomWithDeadlines,
  user: User,
) {
  return (
    await prisma.match.findMany({
      where: {
        prodeId: room.prodeId,
        stage: {
          notIn: [
            "GROUP_A",
            "GROUP_B",
            "GROUP_C",
            "GROUP_D",
            "GROUP_E",
            "GROUP_F",
            "GROUP_G",
            "GROUP_H",
            "GROUP_I",
            "GROUP_J",
            "GROUP_K",
            "GROUP_L",
          ],
        },
      },
      include: {
        userFinalResults: {
          where: {
            userProde: {
              prodeRoomId: room.id,
              userId: user.id,
            },
          },
        },
      },
    })
  )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((match) => ({
      id: match.id,
      date: match.date.toISOString(),
      stage: match.stage,
      filled: match.filled,

      countryStatus: match.userFinalResults[0]
        ? matchCountriesMatchStatus(match, match.userFinalResults[0])
        : null,

      resultStatus:
        match.filled && match.userFinalResults[0]
          ? matchFinalResultStatus(match, match.userFinalResults[0])
          : null,

      disabled: finalsSubmissionsEnded({
        prode: {
          finalsSubmissionsEnd: room.prode.finalsSubmissionsEnd,
        },
      }),

      goalsLeft: match.goalsLeft,
      penaltisLeft: match.penaltisLeft,
      userGoalsLeft: match.userFinalResults[0]?.goalsLeft ?? null,
      userPenaltisLeft: match.userFinalResults[0]?.penaltisLeft ?? null,
      // userCountryLeftId: match.userFinalResults[0]?.countryLeftId ?? null,
      userCountryLeftId: match.countryLeftId ?? null,
      countryLeftId: match.countryLeftId,

      goalsRight: match.goalsRight,
      penaltisRight: match.penaltisRight,
      userGoalsRight: match.userFinalResults[0]?.goalsRight ?? null,
      userPenaltisRight: match.userFinalResults[0]?.penaltisRight ?? null,
      // userCountryRightId: match.userFinalResults[0]?.countryRightId ?? null,
      userCountryRightId: match.countryRightId ?? null,
      countryRightId: match.countryRightId,
    }));
}

export async function getUserTemplateFinalMatches(user: User) {
  const prode = await prisma.prode.findFirst({});
  if (!prode) return [];

  return (
    await prisma.match.findMany({
      where: {
        prodeId: prode.id,
        stage: {
          notIn: [
            "GROUP_A",
            "GROUP_B",
            "GROUP_C",
            "GROUP_D",
            "GROUP_E",
            "GROUP_F",
            "GROUP_G",
            "GROUP_H",
            "GROUP_I",
            "GROUP_J",
            "GROUP_K",
            "GROUP_L",
          ],
        },
      },
      include: {
        userFinalResults: {
          where: {
            userProde: {
              prodeRoomId: null,
              template: true,
              userId: user.id,
            },
          },
        },
      },
    })
  )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((match) => ({
      id: match.id,
      date: match.date.toISOString(),
      stage: match.stage,
      filled: match.filled,

      disabled: finalsSubmissionsEnded({
        prode: {
          finalsSubmissionsEnd: prode.finalsSubmissionsEnd,
        },
      }),

      countryStatus: match.userFinalResults[0]
        ? matchCountriesMatchStatus(match, match.userFinalResults[0])
        : null,

      resultStatus:
        match.filled && match.userFinalResults[0]
          ? matchFinalResultStatus(match, match.userFinalResults[0])
          : null,

      goalsLeft: match.goalsLeft,
      penaltisLeft: match.penaltisLeft,
      userGoalsLeft: match.userFinalResults[0]?.goalsLeft ?? null,
      userPenaltisLeft: match.userFinalResults[0]?.penaltisLeft ?? null,
      // userCountryLeftId: match.userFinalResults[0]?.countryLeftId ?? null,
      userCountryLeftId: match.countryLeftId ?? null,
      countryLeftId: match.countryLeftId,

      goalsRight: match.goalsRight,
      penaltisRight: match.penaltisRight,
      userGoalsRight: match.userFinalResults[0]?.goalsRight ?? null,
      userPenaltisRight: match.userFinalResults[0]?.penaltisRight ?? null,
      // userCountryRightId: match.userFinalResults[0]?.countryRightId ?? null,
      userCountryRightId: match.countryRightId ?? null,
      countryRightId: match.countryRightId,
    }));
}

export async function getUserGroupMatches(
  room: ProdeRoomWithDeadlines,
  user: User,
) {
  return (
    await prisma.match.findMany({
      where: {
        prodeId: room.prodeId,
        stage: {
          in: [
            "GROUP_A",
            "GROUP_B",
            "GROUP_C",
            "GROUP_D",
            "GROUP_E",
            "GROUP_F",
            "GROUP_G",
            "GROUP_H",
            "GROUP_I",
            "GROUP_J",
            "GROUP_K",
            "GROUP_L",
          ],
        },
      },
      include: {
        userResults: {
          where: {
            userProde: {
              prodeRoomId: room.id,
              userId: user.id,
            },
          },
        },
      },
    })
  )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((match) => ({
      id: match.id,
      date: match.date.toISOString(),
      stage: match.stage,
      filled: match.filled,

      disabled: isGroupMatchLocked(match.date, GROUP_MATCHDAY_DEADLINES),

      goalsLeft: match.goalsLeft,
      userGoalsLeft: match.userResults[0]?.goalsLeft ?? null,
      countryLeftId: match.countryLeftId,

      goalsRight: match.goalsRight,
      userGoalsRight: match.userResults[0]?.goalsRight ?? null,
      countryRightId: match.countryRightId,
    }));
}

export async function getUserTemplateGroupMatches(user: User) {
  const prode = await prisma.prode.findFirst({});
  if (!prode) return [];

  return (
    await prisma.match.findMany({
      where: {
        prodeId: prode.id,
        stage: {
          in: [
            "GROUP_A",
            "GROUP_B",
            "GROUP_C",
            "GROUP_D",
            "GROUP_E",
            "GROUP_F",
            "GROUP_G",
            "GROUP_H",
            "GROUP_I",
            "GROUP_J",
            "GROUP_K",
            "GROUP_L",
          ],
        },
      },
      include: {
        userResults: {
          where: {
            userProde: {
              template: true,
              prodeRoomId: null,
              userId: user.id,
            },
          },
        },
      },
    })
  )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((match) => ({
      id: match.id,
      date: match.date.toISOString(),
      stage: match.stage,
      filled: match.filled,

      disabled: isGroupMatchLocked(match.date, GROUP_MATCHDAY_DEADLINES),

      goalsLeft: match.goalsLeft,
      userGoalsLeft: match.userResults[0]?.goalsLeft ?? null,
      countryLeftId: match.countryLeftId,

      goalsRight: match.goalsRight,
      userGoalsRight: match.userResults[0]?.goalsRight ?? null,
      countryRightId: match.countryRightId,
    }));
}

interface Rank extends Pick<
  User,
  "id" | "name" | "image" | "email" | "prodePublic"
> {
  userId: string;
  points: number;
  ranking: number;
  GROUP_A: number;
  GROUP_B: number;
  GROUP_C: number;
  GROUP_D: number;
  GROUP_E: number;
  GROUP_F: number;
  GROUP_G: number;
  GROUP_H: number;
  GROUP_I: number;
  GROUP_J: number;
  GROUP_K: number;
  GROUP_L: number;
  FINALS_16: number;
  FINALS_8: number;
  FINALS_4: number;
  FINALS_2: number;
  FINAL: number;
}

export async function getRanking(
  room: ProdeRoom,
  page: number,
  pageLength: number,
) {
  const query = getRankingQuery(room, {
    offset: page * pageLength,
    limit: pageLength,
  });
  const data: Rank[] = await prisma.$queryRaw(query);

  return data.map((row) => {
    return {
      prodePublic: row["prodePublic"],
      ...["id", "name", "image", "email", "userId"].reduce((r, key) => {
        return {
          ...r,
          [key]: row[key.toLocaleLowerCase() as keyof Rank],
        };
      }, {}),
      ...["points", "ranking"].reduce((r, key) => {
        return {
          ...r,
          [key]: Number(row[key.toLocaleLowerCase() as keyof Rank]),
        };
      }, {}),
    };
  }) as Rank[];
}

export async function getFullRanking(
  room: ProdeRoom,
  page: number,
  pageLength: number,
) {
  const query = getFullRankingQuery(room, {
    offset: page * pageLength,
    limit: pageLength,
  });
  const data: Rank[] = await prisma.$queryRaw(query);

  return data.map((row) => {
    return {
      prodePublic: row["prodePublic"],
      ...["id", "name", "image", "email", "userId"].reduce((r, key) => {
        return {
          ...r,
          [key]: row[key.toLocaleLowerCase() as keyof Rank],
        };
      }, {}),
      ...[
        "GROUP_A",
        "GROUP_B",
        "GROUP_C",
        "GROUP_D",
        "GROUP_E",
        "GROUP_F",
        "GROUP_G",
        "GROUP_H",
        "GROUP_I",
        "GROUP_J",
        "GROUP_K",
        "GROUP_L",
        "FINALS_16",
        "FINALS_8",
        "FINALS_4",
        "FINALS_2",
        "FINAL",
        "points",
        "ranking",
      ].reduce((r, key) => {
        return {
          ...r,
          [key]: Number(row[key.toLocaleLowerCase() as keyof Rank]),
        };
      }, {}),
    };
  }) as Rank[];
}

export async function getUserRanking(room: ProdeRoom, userProde: UserProde) {
  const query = getUserRankingQuery(room, userProde.id);
  const data: Rank[] = await prisma.$queryRaw(query);

  return data.map((row) => {
    return {
      prodePublic: row["prodePublic"],
      ...["id", "name", "image", "email", "userId"].reduce((r, key) => {
        return {
          ...r,
          [key]: row[key.toLocaleLowerCase() as keyof Rank],
        };
      }, {}),
      ...["points", "ranking"].reduce((r, key) => {
        return {
          ...r,
          [key]: Number(row[key.toLocaleLowerCase() as keyof Rank]),
        };
      }, {}),
    };
  })?.[0] as Rank;
}

export async function getUserFullRanking(
  room: ProdeRoom,
  userProde: UserProde,
) {
  const query = getUserFullRankingQuery(room, userProde.id);
  const data: Rank[] = await prisma.$queryRaw(query);

  return data.map((row) => {
    return {
      prodePublic: row["prodePublic"],
      ...["id", "name", "image", "email", "userId"].reduce((r, key) => {
        return {
          ...r,
          [key]: row[key.toLocaleLowerCase() as keyof Rank],
        };
      }, {}),
      ...[
        "GROUP_A",
        "GROUP_B",
        "GROUP_C",
        "GROUP_D",
        "GROUP_E",
        "GROUP_F",
        "GROUP_G",
        "GROUP_H",
        "GROUP_I",
        "GROUP_J",
        "GROUP_K",
        "GROUP_L",
        "FINALS_16",
        "FINALS_8",
        "FINALS_4",
        "FINALS_2",
        "FINAL",
        "points",
        "ranking",
      ].reduce((r, key) => {
        return {
          ...r,
          [key]: Number(row[key.toLocaleLowerCase() as keyof Rank]),
        };
      }, {}),
    };
  })?.[0] as Rank;
}

export async function syncronizeTemplate(room: ProdeRoom, user: User) {
  const currentProdeMatches = await prisma.prodeUserGroupMatch.findMany({
    where: {
      userProde: {
        prodeRoomId: room.id,
        userId: user.id,
      },
    },
    select: {
      matchId: true,
      goalsLeft: true,
      goalsRight: true,
    },
  });

  const templateUserProde = await getUserTemplateProde(user);
  if (!templateUserProde) return;

  const templateProdeMatches = await prisma.prodeUserGroupMatch.findMany({
    where: {
      userProdeId: templateUserProde.id,
    },
    select: {
      matchId: true,
      goalsLeft: true,
      goalsRight: true,
    },
  });

  const createTemplateMatches = currentProdeMatches.filter(
    (match) =>
      !templateProdeMatches.find((tMatch) => tMatch.matchId === match.matchId),
  );
  const updateTemplateMatches = currentProdeMatches.filter((match) =>
    templateProdeMatches.find((tMatch) => tMatch.matchId === match.matchId),
  );

  await prisma.$transaction([
    prisma.prodeUserGroupMatch.createMany({
      data: createTemplateMatches.map((match) => ({
        ...match,
        userProdeId: templateUserProde.id,
      })),
    }),
    ...updateTemplateMatches.map((match) =>
      prisma.prodeUserGroupMatch.updateMany({
        data: {
          goalsLeft: match.goalsLeft,
          goalsRight: match.goalsRight,
        },
        where: {
          matchId: match.matchId,
          userProde: {
            prodeRoomId: null,
            userId: user.id,
            template: true,
          },
        },
      }),
    ),
  ]);
}

export async function syncronizeFinalsTemplate(room: ProdeRoom, user: User) {
  const currentProdeMatches = await prisma.prodeUserFinalsMatch.findMany({
    where: {
      userProde: {
        prodeRoomId: room.id,
        userId: user.id,
      },
      match: {
        countryLeftId: { not: null },
        countryRightId: { not: null },
      },
    },
    select: {
      matchId: true,
      goalsLeft: true,
      goalsRight: true,
      penaltisLeft: true,
      penaltisRight: true,
      match: true,
    },
  });

  const templateUserProde = await getUserTemplateProde(user);
  if (!templateUserProde) return;

  const templateProdeMatches = await prisma.prodeUserFinalsMatch.findMany({
    where: {
      userProdeId: templateUserProde.id,
    },
    select: {
      matchId: true,
    },
  });

  const createTemplateMatches = currentProdeMatches.filter(
    (match) =>
      !templateProdeMatches.find((tMatch) => tMatch.matchId === match.matchId),
  );
  const updateTemplateMatches = currentProdeMatches.filter((match) =>
    templateProdeMatches.find((tMatch) => tMatch.matchId === match.matchId),
  );

  await prisma.$transaction([
    prisma.prodeUserFinalsMatch.createMany({
      data: createTemplateMatches.map((match) => ({
        ...match,
        match: undefined,
        userProdeId: templateUserProde.id,
        countryLeftId: match.match.countryLeftId || "",
        countryRightId: match.match.countryRightId || "",
      })),
    }),
    ...updateTemplateMatches.map((match) =>
      prisma.prodeUserFinalsMatch.updateMany({
        data: {
          goalsLeft: match.goalsLeft,
          goalsRight: match.goalsRight,
          penaltisLeft: match.penaltisLeft,
          penaltisRight: match.penaltisRight,
          countryLeftId: match.match.countryLeftId || "",
          countryRightId: match.match.countryRightId || "",
        },
        where: {
          matchId: match.matchId,
          userProde: {
            prodeRoomId: null,
            userId: user.id,
            template: true,
          },
        },
      }),
    ),
  ]);
}

export async function getCountries() {
  return prisma.country.findMany({});
}

export async function getAllowedMatchesToModify(
  ids: string[],
  submissionsEnd: Date,
) {
  if (isDeadlineReached(submissionsEnd)) return [];

  return (
    await prisma.match.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
      },
    })
  ).map((match) => match.id);
}

/**
 * Group-stage variant of getAllowedMatchesToModify. Locks per matchday: a match
 * is editable only while its fecha has not kicked off (see config/matchdays.ts).
 * Unlike the phase-wide finals path, this stays open across fechas so players
 * complete the tournament fecha by fecha.
 */
export async function getAllowedGroupMatchesToModify(ids: string[]) {
  const now = new Date();

  return (
    await prisma.match.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        date: true,
      },
    })
  )
    .filter((match) => !isGroupMatchLocked(match.date, GROUP_MATCHDAY_DEADLINES, now))
    .map((match) => match.id);
}

export async function deleteUserProde(userProdeId: string) {
  await prisma.prodeUserGroupMatch.deleteMany({
    where: {
      userProdeId,
    },
  });

  await prisma.prodeUserFinalsMatch.deleteMany({
    where: {
      userProdeId,
    },
  });

  await prisma.userProde.deleteMany({
    where: {
      id: userProdeId,
    },
  });
}
