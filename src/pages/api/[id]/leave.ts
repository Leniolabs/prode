// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";
import {
  deleteUserProde,
  getUserByEmail,
  getUserProdeById,
} from "../../../utils/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  const userProdeId = req.query?.id as string;
  if (!userProdeId) return res.status(404).send({});

  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "DELETE") {
    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

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
}
