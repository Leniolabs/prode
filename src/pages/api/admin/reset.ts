// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../lib";

export default withAuth(async (req, res) => {
  if (req.method === "POST") {
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
              "GROUP_L",
            ],
          },
        },
      }),
    ]);

    return res.status(200).send({});
  }

  res.status(400).send({});
}, { ownership: 'admin' });
