// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../lib";
import { getUserByEmail, registerUserToRoom } from "../../utils/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).json([]);

  if (req.method === "POST") {
    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

    const prode = await prisma.prode.findFirst();
    if (!prode)
      return res.status(400).send({
        error: "PRODE_DOESNT_EXISTS",
      });

    const {
      name,
      password,
      pointsGoals,
      pointsWinner,
      pointsPenal,
      public: isPublic,
      emailDomain,
    } = req.body;

    const newRoom = await prisma.prodeRoom.create({
      data: {
        created: new Date(),
        prodeId: prode.id,
        userId: user.id,
        name: name,
        password: password ? password : null,
        public: isPublic ? true : false,
        pointsWinner: pointsWinner || 1,
        pointsGoals: pointsGoals || 3,
        pointsPenal: pointsPenal || 5,
        emailDomain: emailDomain ? emailDomain.replace("@", "") : null,
      },
    });

    await registerUserToRoom(newRoom, user);

    return res.status(200).json({
      id: newRoom.id,
    });
  }

  res.status(400).send({});
}
