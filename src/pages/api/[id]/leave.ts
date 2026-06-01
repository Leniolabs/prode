// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../lib";
import {
  deleteUserProde,
  getUserProdeById,
} from "../../../utils/queries";

export default withAuth(async (req, res, { user }) => {
  const userProdeId = req.query?.id as string;
  if (!userProdeId) return res.status(404).send({});

  if (req.method === "DELETE") {
    const userProde = await getUserProdeById(userProdeId);
    if (!userProde || !userProde.prodeRoom) return res.status(404).send({});

    const isAdmin = userProde.userId === user.id;

    const usersLength = await prisma.userProde.count({
      where: {
        prodeRoomId: userProde.prodeRoomId,
      },
    });

    if (userProde.prodeRoomId) {
      if (usersLength > 1 && isAdmin) {
        const firstUserProde = await prisma.userProde.findFirst({
          where: {
            prodeRoomId: userProde.prodeRoomId,
            userId: {
              not: userProde.userId,
            },
          },
        });
        if (firstUserProde) {
          await prisma.prodeRoom.update({
            where: {
              id: userProde.prodeRoomId,
            },
            data: {
              userId: firstUserProde.userId,
            },
          });

          await deleteUserProde(userProde.id);
        }
      } else {
        await deleteUserProde(userProde.id);
        await prisma.prodeRoom.deleteMany({
          where: {
            id: userProde.prodeRoomId,
          },
        });
      }
    }

    return res.status(200).json({});
  }

  res.status(400).send({});
});
