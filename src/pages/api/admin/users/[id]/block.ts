// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../../../lib";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {},
  res: NextApiResponse<{}>
) {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

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
}
