// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../lib";

export default withAuth(async (req, res) => {
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
});
