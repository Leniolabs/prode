import { ProdeRoom, Stage } from "@/generated/prisma";

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
     --goles exactos y gana left en penales (goles ok, ganador correcto, pero penales no exactos)
     WHEN pugm."goalsLeft" = m."goalsLeft" and pugm."goalsRight" = m."goalsRight" and pugm."penaltisLeft" > pugm."penaltisRight" and m."penaltisLeft" > m."penaltisRight"
     THEN ${room.pointsGoals}
     --goles exactos y gana right en penales (goles ok, ganador correcto, pero penales no exactos)
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
case when fp8."points" is not null then fp."points" else 0 end FINALS_8,
case when fp4."points" is not null then fp."points" else 0 end FINALS_4,
case when fp2."points" is not null then fp."points" else 0 end FINALS_2,
case when fp1."points" is not null then fp."points" else 0 end FINAL,
case 
when fp."points" is not null and gp."points" is not null then gp."points" + fp."points" 
when gp."points" is not null then gp."points"
when fp."points" is not null then fp."points"
else 0 end points
from "UserProde" up inner join "User" u on u."id" = up."userId"
left outer join (${getSubqueryGroups(room)}) gp on gp."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room)}) fp on fp."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, [
    "FINALS_8_1",
    "FINALS_8_2",
    "FINALS_8_3",
    "FINALS_8_4",
    "FINALS_8_5",
    "FINALS_8_6",
    "FINALS_8_7",
    "FINALS_8_8",
  ])}) fp8 on fp8."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, [
    "FINALS_4_1",
    "FINALS_4_2",
    "FINALS_4_3",
    "FINALS_4_4",
  ])}) fp4 on fp4."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, [
    "FINALS_2_1",
    "FINALS_2_2",
  ])}) fp2 on fp2."userProdeId" = up."id"
left outer join (${getSubqueryFinals(room, [
    "FINALS",
    "THIRD_PLACE",
  ])}) fp1 on fp1."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_A"
  )}) gpA on gpA."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_B"
  )}) gpB on gpB."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_C"
  )}) gpC on gpC."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_D"
  )}) gpD on gpD."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_E"
  )}) gpE on gpE."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_F"
  )}) gpF on gpF."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_G"
  )}) gpG on gpG."userProdeId" = up."id"
left outer join (${getSubqueryGroups(
    room,
    "GROUP_H"
  )}) gpH on gpH."userProdeId" = up."id"
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
