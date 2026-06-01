// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../../../lib";

export default withAuth(async (req, res) => {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  if (req.method === "POST") {
    await prisma.$transaction([
      prisma.prodeUserFinalsMatch.deleteMany({
        where: {
          userProde: {
            prodeRoomId: id,
          },
        },
      }),
      prisma.prodeUserGroupMatch.deleteMany({
        where: {
          userProde: {
            prodeRoomId: id,
          },
        },
      }),
      prisma.userProde.deleteMany({
        where: {
          prodeRoomId: id,
        },
      }),
      prisma.prodeRoom.delete({
        where: {
          id,
        },
      }),
    ]);

    return res.status(200).send({});
  }

  res.status(400).send({});
}, { ownership: 'admin' });
