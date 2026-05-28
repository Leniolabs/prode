// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ProdeUserFinalsMatch } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";
import {
  getAllowedMatchesToModify,
  getProdeRoom,
  getUserByEmail,
  syncronizeFinalsTemplate,
} from "../../../utils/queries";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {
    body: {
      matches: Pick<
        ProdeUserFinalsMatch,
        | "countryLeftId"
        | "countryRightId"
        | "goalsLeft"
        | "goalsRight"
        | "penaltisLeft"
        | "penaltisRight"
        | "matchId"
      >[];
    };
  },
  res: NextApiResponse<{}>
) {
  const id = req.query?.id as string;

  if (!id) return res.status(404).send({});

  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "POST") {
    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

    const room = await getProdeRoom(id);
    if (!room) return res.status(404).send({});

    const { matches } = req.body;
    if (!matches) return res.status(400).json({});

    const userProde = await prisma.userProde.findFirst({
      where: {
        prodeRoomId: id,
        userId: user.id,
      },
      include: {
        finalsMatches: true,
        prode: true,
      },
    });
    if (!userProde) return res.status(400).json({});

    const updateMatches = matches.filter((match) =>
      userProde.finalsMatches.find((x) => x.matchId === match.matchId)
    );
    const createMatches = matches.filter(
      (match) => !updateMatches.find((x) => x.matchId === match.matchId)
    );

    const allowedMatchesToModify = await getAllowedMatchesToModify(
      matches.map((match) => match.matchId)
    );

    await prisma.$transaction([
      ...updateMatches
        .filter((match) => allowedMatchesToModify.includes(match.matchId))
        .map((match) =>
          prisma.prodeUserFinalsMatch.update({
            data: {
              goalsLeft: match.goalsLeft,
              goalsRight: match.goalsRight,
              penaltisLeft: match.penaltisLeft,
              penaltisRight: match.penaltisRight,
            },
            where: {
              userProdeId_matchId: {
                matchId: match.matchId as string,
                userProdeId: userProde.id,
              },
            },
          })
        ),
      prisma.prodeUserFinalsMatch.createMany({
        data: createMatches
          .filter((match) => allowedMatchesToModify.includes(match.matchId))
          .map((match) => ({
            ...match,
            userProdeId: userProde.id,
          })),
      }),
    ]);

    await syncronizeFinalsTemplate(room, user);

    return res.status(201).send({});
  }

  res.status(400).send({});
}
