// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";
import { getProdeRoom, getUserByEmail } from "../../../utils/queries";
import { hashPassword } from "@/lib/auth/passwords";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "PUT") {
    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

    const room = await getProdeRoom(id);
    if (!room) return res.status(404).json({});

    if (room.userId !== user.id) return res.status(401).json({});

    const {
      name,
      password,
      pointsGoals,
      pointsWinner,
      pointsPenal,
      public: isPublic,
      emailDomain,
    } = req.body;

    const passwordHash = password ? await hashPassword(password) : undefined;

    const newRoom = await prisma.prodeRoom.update({
      where: {
        id: room.id,
      },
      data: {
        name: name,
        password: null,
        ...(passwordHash !== undefined ? { passwordHash } : {}),
        public: isPublic ? true : false,
        pointsWinner: pointsWinner || 1,
        pointsGoals: pointsGoals || 3,
        pointsPenal: pointsPenal || 5,
        emailDomain: emailDomain ? emailDomain.replace("@", "") : null,
      },
    });

    return res.status(200).json({
      id: newRoom.id,
    });
  }

  res.status(400).send({});
}
