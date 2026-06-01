// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../../../lib";

export default withAuth(async (req, res) => {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  if (req.method === "POST") {
    const userToBlock = await prisma.user.findUnique({ where: { id } });

    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        blocked: !userToBlock?.blocked,
      },
    });

    return res.status(200).send({});
  }

  res.status(400).send({});
}, { ownership: 'admin' });
