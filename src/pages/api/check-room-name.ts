// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../lib";
import { getUserByEmail, getUserProdeById } from "../../utils/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "GET") {
    const { name } = req.query;

    if (!name) return res.status(200).send({ allowed: false });
    const room = await prisma.prodeRoom.findFirst({
      where: {
        name: name as string,
      },
    });
    return res.status(200).json({
      allowed: !room,
    });
  }

  res.status(400).send({});
}
