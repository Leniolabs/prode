// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "../../../lib";

export default withAuth(async (req, res, { room }) => {
  if (req.method === "PUT") {
    const {
      name,
      password,
      pointsGoals,
      pointsWinner,
      pointsPenal,
      public: isPublic,
      emailDomain,
    } = req.body;

    const newRoom = await prisma.prodeRoom.update({
      where: {
        id: room!.id,
      },
      data: {
        name: name,
        password: password ? password : null,
        public: isPublic ? true : false,
        pointsWinner: pointsWinner || 1,
        pointsGoals: pointsGoals || 3,
        pointsPenal: pointsPenal || 5,
        emailDomain: emailDomain ? emailDomain.replace("@", "") : null,
      },
    });

    return res.status(200).json({
      id: newRoom.id,
    });
  }

  res.status(400).send({});
}, { ownership: 'room' });
