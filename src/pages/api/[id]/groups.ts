// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ProdeUserGroupMatch } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";
import {
  getAllowedMatchesToModify,
  getProdeRoom,
  getUserByEmail,
  syncronizeTemplate,
} from "../../../utils/queries";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {
    body: {
      matches: Pick<
        ProdeUserGroupMatch,
        "matchId" | "goalsLeft" | "goalsRight"
      >[];
    };
  },
  res: NextApiResponse<{}>
) {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  if (req.method === "POST") {
    const session = await getSession({ req });
    if (!session || !session.user?.email) return res.status(401).send({});

    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

    const room = await getProdeRoom(id);
    if (!room) return res.status(404).send({});

    const { matches } = req.body;
    if (!matches) return res.status(400).json({});

    const userProde = await prisma.userProde.findFirst({
      where: {
        userId: user.id,
        prodeRoomId: id,
      },
      include: {
        matches: true,
        prode: true,
      },
    });
    if (!userProde) return res.status(404).json({});

    const updateMatches = matches.filter((match) =>
      userProde.matches.find((x) => x.matchId === match.matchId)
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
          prisma.prodeUserGroupMatch.update({
            data: {
              goalsLeft: match.goalsLeft,
              goalsRight: match.goalsRight,
            },
            where: {
              userProdeId_matchId: {
                matchId: match.matchId,
                userProdeId: userProde.id,
              },
            },
          })
        ),
      prisma.prodeUserGroupMatch.createMany({
        data: createMatches
          .filter((match) => allowedMatchesToModify.includes(match.matchId))
          .map((match) => ({
            ...match,
            userProdeId: userProde.id,
          })),
      }),
    ]);

    //sync with template
    await syncronizeTemplate(room, user);

    return res.status(200).send({
      matches,
    });
  }

  res.status(400).send({});
}
