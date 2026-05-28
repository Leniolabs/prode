// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";
import { getUserByEmail, getUserProdeById } from "../../../utils/queries";

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
    if (!userProde || user.id === userProde.userId)
      return res.status(404).send({});

    if (userProde.prodeRoom?.userId !== user.id)
      return res.status(401).json({});

    await prisma.userProde.deleteMany({
      where: {
        id: userProde.id,
      },
    });

    return res.status(200).json({});
  }

  res.status(400).send({});
}
