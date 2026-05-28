// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {
    
  },
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });

  if (!session || !session.user?.email) return res.status(401).send({});

  if (req.method === "POST") {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.email !== process.env.ADMIN_EMAIL)
      return res.status(401).send({});

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
}
