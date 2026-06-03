import { ProdeRoom, Stage } from "@prisma/client";

const GROUP_STAGES: Stage[] = [
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
];

const FINALS_16_STAGES: Stage[] = [
  "FINALS_16_1",
  "FINALS_16_2",
  "FINALS_16_3",
  "FINALS_16_4",
  "FINALS_16_5",
  "FINALS_16_6",
  "FINALS_16_7",
  "FINALS_16_8",
  "FINALS_16_9",
  "FINALS_16_10",
  "FINALS_16_11",
  "FINALS_16_12",
  "FINALS_16_13",
  "FINALS_16_14",
  "FINALS_16_15",
  "FINALS_16_16",
];

const FINALS_8_STAGES: Stage[] = [
  "FINALS_8_1",
  "FINALS_8_2",
  "FINALS_8_3",
  "FINALS_8_4",
  "FINALS_8_5",
  "FINALS_8_6",
  "FINALS_8_7",
  "FINALS_8_8",
];

const FINALS_4_STAGES: Stage[] = [
  "FINALS_4_1",
  "FINALS_4_2",
  "FINALS_4_3",
  "FINALS_4_4",
];

const FINALS_2_STAGES: Stage[] = ["FINALS_2_1", "FINALS_2_2"];

const FINAL_STAGES: Stage[] = ["FINALS", "THIRD_PLACE"];

export function getSubqueryFinals(room: ProdeRoom, stages?: Stage[]) {
  return `select
  pugm."userProdeId",
  SUM(case
     --resultado exacto con penales
     WHEN pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight" and pugm."penaltisLeft" = m."penaltisLeft" and pugm."penaltisRight" = m."penaltisRight"
     THEN ${room.pointsPenal}
     --gana left con goles exactos sin penales
     WHEN pugm."goalsLeft" > pugm."goalsRight" and m."goalsLeft" > m."goalsRight" and pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight"
     THEN ${room.pointsGoals}
     --gana right con goles exactos sin penales
     WHEN pugm."goalsLeft" < pugm."goalsRight" and m."goalsLeft" < m."goalsRight" and pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight"
     THEN ${room.pointsGoals}
     --gana left con goles diferentes sin penales
     WHEN pugm."goalsLeft" > pugm."goalsRight" and m."goalsLeft" > m."goalsRight"
     THEN ${room.pointsWinner}
     --gana right con goles diferentes sin penales
     WHEN pugm."goalsLeft" < pugm."goalsRight" and m."goalsLeft" < m."goalsRight"
     THEN ${room.pointsWinner}
     --goles exactos y gana left en penales
     WHEN pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight" and pugm."penaltisLeft" > pugm."penaltisRight" and m."penaltisLeft" > m."penaltisRight"
     THEN ${room.pointsGoals}
     --goles exactos y gana right en penales
     WHEN pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight" and pugm."penaltisLeft" < pugm."penaltisRight" and m."penaltisLeft" < m."penaltisRight"
     THEN ${room.pointsGoals}
     --empate con goles diferentes y gana left en penales
     WHEN pugm."goalsLeft" = pugm."goalsRight" and m."goalsLeft" = m."goalsRight" and pugm."penaltisLeft" > pugm."penaltisRight" and m."penaltisLeft" > m."penaltisRight"
     THEN ${room.pointsWinner}
     --empate con goles diferentes y gana right en penales
     when pugm."goalsLeft" = pugm."goalsRight" and m."goalsLeft" = m."goalsRight" and pugm."penaltisLeft" < pugm."penaltisRight" and m."penaltisLeft" < m."penaltisRight"
     THEN ${room.pointsWinner}
     --gana left en goles, pero gana left en penales
     WHEN pugm."goalsLeft" > pugm."goalsRight" and m."goalsLeft" = m."goalsRight" and m."penaltisLeft" > m."penaltisRight"
     then ${room.pointsWinner}
     --gana right en goles, pero gana right en penales
     WHEN pugm."goalsLeft" < pugm."goalsRight" and m."goalsLeft" = m."goalsRight" and m."penaltisLeft" < m."penaltisRight"
     THEN ${room.pointsWinner}
     --empate y gana left en penales, pero gana en goles
     WHEN pugm."goalsLeft" = pugm."goalsRight" and pugm."penaltisLeft" > pugm."penaltisRight" and m."goalsLeft" > m."goalsRight"
     THEN ${room.pointsWinner}
     --empate y gana right en penales, pero gana en goles
     WHEN pugm."goalsLeft" = pugm."goalsRight" and pugm."penaltisLeft" < pugm."penaltisRight" and m."goalsLeft" < m."goalsRight"
     THEN ${room.pointsWinner}
     else 0
  end) points
  from "ProdeUserFinalsMatch" pugm
  inner join "Match" m on m."id" = pugm."matchId" ${
    stages
      ? `where m."stage" in (${stages.reduce(
          (r, stage) => (r ? `${r}, ` : "") + `'${stage}'`,
          ""
        )})`
      : ""
  }
  group by pugm."userProdeId"`;
}

export function getSubqueryGroups(room: ProdeRoom, stage?: Stage) {
  return `select
    pugm."userProdeId",
    SUM(CASE
       WHEN pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight"
       THEN ${room.pointsGoals}
       WHEN pugm."goalsLeft" = pugm."goalsRight" and m."goalsLeft" = m."goalsRight"
       THEN ${room.pointsWinner}
       WHEN pugm."goalsLeft" > pugm."goalsRight" and m."goalsLeft" > m."goalsRight"
       THEN ${room.pointsWinner}
       WHEN pugm."goalsLeft" < pugm."goalsRight" and m."goalsLeft" < m."goalsRight"
       THEN ${room.pointsWinner}
       else 0
    end) points
    from "ProdeUserGroupMatch" pugm
    inner join "Match" m on m."id" = pugm."matchId" ${
      stage
        ? ` where 
      m."stage" in 
      (
        '${stage}'
      ) `
        : ""
    }
    group by pugm."userProdeId"`;
}

export function getRankingQuery(
  room: ProdeRoom,
  options?: {
    offset?: number;
    limit?: number;
  }
) {
  return `select *,
  RANK () OVER ( 
    ORDER BY rq."points" DESC, rq."email" ASC
) ranking 
  FROM (select 
up."id",
u."id" userId,
u."name",
u."email",
u."image",
u."prodePublic",
case 
when fp."points" is not null and gp."points" is not null then gp."points" + fp."points" 
when gp."points" is not null then gp."points"
when fp."points" is not null then fp."points"
else 0 end points
from "UserProde" up inner join "User" u on u."id" = up."userId"
left outer join (${getSubqueryGroups(room)}) gp on gp."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room)}) fp on fp."userProdeId" = up."id"
where up."prodeRoomId" = '${room.id}') rq 
order by rq."points" DESC, rq."email" ASC
${options?.offset ? ` offset ${options?.offset}` : ""} ${
    options?.limit ? ` limit ${options?.limit}` : ""
  }`;
}

export function getFullRankingQuery(
  room: ProdeRoom,
  options?: {
    offset?: number;
    limit?: number;
  }
) {
  return `select *,
  RANK () OVER ( 
    ORDER BY rq."points" DESC, rq."email" ASC
) ranking 
  FROM (select 
up."id",
u."id" userId,
u."name",
u."email",
u."image",
u."prodePublic",
case when gpA."points" is not null then gpA."points" else 0 end GROUP_A,
case when gpB."points" is not null then gpB."points" else 0 end GROUP_B,
case when gpC."points" is not null then gpC."points" else 0 end GROUP_C,
case when gpD."points" is not null then gpD."points" else 0 end GROUP_D,
case when gpE."points" is not null then gpE."points" else 0 end GROUP_E,
case when gpF."points" is not null then gpF."points" else 0 end GROUP_F,
case when gpG."points" is not null then gpG."points" else 0 end GROUP_G,
case when gpH."points" is not null then gpH."points" else 0 end GROUP_H,
case when gpI."points" is not null then gpI."points" else 0 end GROUP_I,
case when gpJ."points" is not null then gpJ."points" else 0 end GROUP_J,
case when gpK."points" is not null then gpK."points" else 0 end GROUP_K,
case when gpL."points" is not null then gpL."points" else 0 end GROUP_L,
case when fp16."points" is not null then fp16."points" else 0 end FINALS_16,
case when fp8."points" is not null then fp8."points" else 0 end FINALS_8,
case when fp4."points" is not null then fp4."points" else 0 end FINALS_4,
case when fp2."points" is not null then fp2."points" else 0 end FINALS_2,
case when fp1."points" is not null then fp1."points" else 0 end FINAL,
case 
when fp."points" is not null and gp."points" is not null then gp."points" + fp."points" 
when gp."points" is not null then gp."points"
when fp."points" is not null then fp."points"
else 0 end points
from "UserProde" up inner join "User" u on u."id" = up."userId"
left outer join (${getSubqueryGroups(room)}) gp on gp."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room)}) fp on fp."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, FINALS_16_STAGES)}) fp16 on fp16."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, FINALS_8_STAGES)}) fp8 on fp8."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, FINALS_4_STAGES)}) fp4 on fp4."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, FINALS_2_STAGES)}) fp2 on fp2."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, FINAL_STAGES)}) fp1 on fp1."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[0])}) gpA on gpA."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[1])}) gpB on gpB."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[2])}) gpC on gpC."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[3])}) gpD on gpD."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[4])}) gpE on gpE."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[5])}) gpF on gpF."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[6])}) gpG on gpG."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[7])}) gpH on gpH."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[8])}) gpI on gpI."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[9])}) gpJ on gpJ."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[10])}) gpK on gpK."userProdeId" = up."id"
left outer join (${getSubqueryGroups(room, GROUP_STAGES[11])}) gpL on gpL."userProdeId" = up."id"
where up."prodeRoomId" = '${room.id}') rq 
order by rq."points" DESC, rq."email" ASC
${options?.offset ? ` offset ${options?.offset}` : ""} ${
    options?.limit ? ` limit ${options?.limit}` : ""
  }`;
}

export function getUserFullRankingQuery(room: ProdeRoom, userProdeId: string) {
  return `select * from (${getFullRankingQuery(
    room
  )}) rankq WHERE rankq."id" = '${userProdeId}'`;
}

export function getUserRankingQuery(room: ProdeRoom, userProdeId: string) {
  return `select * from (${getRankingQuery(
    room
  )}) rankq WHERE rankq."id" = '${userProdeId}'`;
}
