// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Match, ProdeUserGroupMatch } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {
    body: {
      matches: Pick<
        Match,
        | "id"
        | "goalsLeft"
        | "goalsRight"
        | "countryLeftId"
        | "countryRightId"
        | "penaltisLeft"
        | "penaltisRight"
      >[];
    };
  },
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });

  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "GET") {
  } else if (req.method === "POST") {
    const { matches } = req.body;

    if (!matches) return res.status(400).json({});

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.email !== process.env.ADMIN_EMAIL)
      return res.status(401).json({});

    //latest active prode
    const prode = await prisma.prode.findFirst({});

    if (!prode) return res.status(400).json({});

    await prisma.$transaction(
      matches.map((match) =>
        prisma.match.update({
          data: {
            countryLeftId: match.countryLeftId,
            goalsLeft: match.goalsLeft,
            countryRightId: match.countryRightId,
            goalsRight: match.goalsRight,
            penaltisLeft: match.penaltisLeft,
            penaltisRight: match.penaltisRight,
            filled: !!(
              match.countryLeftId &&
              match.countryRightId &&
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0)
            ),
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
}
