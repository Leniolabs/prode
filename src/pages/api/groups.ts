// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ProdeUserGroupMatch } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../lib";
import { getAllowedMatchesToModify } from "../../utils/queries";

export default withAuth(async (
  req: Omit<NextApiRequest, "body"> & {
    body: {
      matches: Pick<
        ProdeUserGroupMatch,
        "matchId" | "goalsLeft" | "goalsRight"
      >[];
    };
  },
  res,
  { user }
) => {
  if (req.method === "POST") {
    const { matches } = req.body;
    if (!matches) return res.status(400).json({});

    const userProde = await prisma.userProde.findFirst({
      where: {
        userId: user.id,
        prodeRoomId: null,
        template: true,
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

    return res.status(200).send({
      matches,
    });
  }

  res.status(400).send({});
});
