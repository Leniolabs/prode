// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Match, ProdeUserGroupMatch } from "@/generated/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../lib";

export default withAuth(async (
  req: Omit<NextApiRequest, "body"> & {
    body: {
      matches: Pick<Match, "id" | "goalsLeft" | "goalsRight">[];
    };
  },
  res
) => {
  if (req.method === "GET") {
  } else if (req.method === "POST") {
    const { matches } = req.body;

    if (!matches) return res.status(400).json({});

    //latest active prode
    const prode = await prisma.prode.findFirst({
      where: {
        prodeEnd: {
          gte: new Date(),
        },
      },
    });

    if (!prode) return res.status(400).json({});

    await prisma.$transaction(
      matches.map((match) =>
        prisma.match.update({
          data: {
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
            filled: true,
          },
          where: {
            id: match.id,
          },
        })
      )
    );

    return res.status(200).send({
      matches,
    });
  }

  res.status(400).send({});
}, { ownership: 'admin' });
