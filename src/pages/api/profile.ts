// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../lib";

export default withAuth(async (
  req: Omit<NextApiRequest, "body"> & {
    body: {
      name: string;
      prodePublic: boolean;
      dark: boolean;
      background: string;
      image: string;
    };
  },
  res,
  { user }
) => {
  if (req.method === "PATCH") {
    await prisma.user.update({
      where: {
        id: user.id,
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
});
