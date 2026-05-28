// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {},
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });

  if (!session || !session.user?.email) return res.status(401).send({});

  if (req.method === "POST") {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.email !== process.env.ADMIN_EMAIL)
      return res.status(401).send({});

    //latest active prode
    const prode = await prisma.prode.findFirst({
      where: {
        prodeEnd: {
          gte: new Date(),
        },
      },
    });
    if (!prode) return res.status(404).send({});

    await prisma.$transaction([
      prisma.prodeUserFinalsMatch.deleteMany({}),
      prisma.prodeUserGroupMatch.deleteMany({}),
      prisma.userProde.deleteMany({}),
      prisma.prodeRoom.deleteMany({}),
      prisma.match.updateMany({
        data: {
          goalsLeft: null,
          goalsRight: null,
          penaltisLeft: null,
          penaltisRight: null,
          filled: false,
        },
      }),
      prisma.match.updateMany({
        data: {
          countryLeftId: null,
          countryRightId: null,
        },
        where: {
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
              "GROUP_L",            ],
          },
        },
      }),
    ]);

    return res.status(200).send({});
  }

  res.status(400).send({});
}
