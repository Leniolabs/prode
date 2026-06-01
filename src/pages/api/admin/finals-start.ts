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

    if (!prode || prode.stage === "FINALS") return res.status(200).send({});

    await prisma.prode.update({
      data: {
        stage: "FINALS",
      },
      where: {
        id: prode.id,
      },
    });

    return res.status(200).send({});
  }

  res.status(400).send({});
}, { ownership: 'admin' });
