// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ProdeUserFinalsMatch } from '@/generated/prisma';
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../lib";

export default async function handler(
  req: Omit<NextApiRequest, "body"> & {
    body: {
      name: string;
      prodePublic: boolean;
      dark: boolean;
      background: string;
      image: string;
    };
  },
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });

  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "PATCH") {
    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        name: req.body.name,
        image: req.body.image,
        prodePublic: req.body.prodePublic,
        background: req.body.background,
        dark: req.body.dark,
      },
    });

    return res.status(200).json({});
  }

  res.status(400).send({});
}
