// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../lib";
import { getUserProdeById } from "../../../utils/queries";

export default withAuth(async (req, res, { user }) => {
  const userProdeId = req.query?.id as string;
  if (!userProdeId) return res.status(404).send({});

  if (req.method === "DELETE") {
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
});
