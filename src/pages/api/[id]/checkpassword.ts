// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/withAuth";
import {
  getProdeRoom,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from "../../../utils/queries";

export default withAuth(async (req, res, { user }) => {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  if (req.method === "POST") {
    const { password } = req.body;

    const room = await getProdeRoom(id);
    if (!room) return res.status(404).json({});

    if (
      room.emailDomain &&
      (!user.email || !user.email.endsWith(`@${room.emailDomain}`))
    ) {
      return res.status(200).json({ allowed: false, code: "EMAIL_DOMAIN" });
    }

    if (room.password && room.password !== password) {
      return res.status(200).json({ allowed: false, code: "WRONG_PASSWORD" });
    }

    const userIsRegistered = await isUserRegisteredToRoom(room, user);
    if (!userIsRegistered) {
      await registerUserToRoom(room, user);
      return res.status(200).json({ allowed: true });
    }
  }

  res.status(400).send({});
});
