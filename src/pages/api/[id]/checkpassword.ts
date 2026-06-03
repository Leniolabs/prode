// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import {
  getProdeRoom,
  getUserByEmail,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from "../../../utils/queries";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { prisma } from "../../../lib";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  const id = req.query?.id as string;
  if (!id) return res.status(404).send({});

  const session = await getSession({ req });
  if (!session || !session.user?.email) return res.status(401).send({});

  if (req.method === "POST") {
    const { password } = req.body;

    const user = await getUserByEmail(session.user.email);
    if (!user) return res.status(401).send({});

    const room = await getProdeRoom(id);
    if (!room) return res.status(404).json({});

    if (
      room.emailDomain &&
      (!user.email || !user.email.endsWith(`@${room.emailDomain}`))
    ) {
      return res.status(200).json({ allowed: false, code: "EMAIL_DOMAIN" });
    }

    if (room.passwordHash) {
      // New hashed path
      const valid = await verifyPassword(password, room.passwordHash);
      if (!valid) {
        return res.status(200).json({ allowed: false, code: "WRONG_PASSWORD" });
      }
    } else if (room.password) {
      // Legacy plaintext path — verify and migrate on the fly
      if (room.password !== password) {
        return res.status(200).json({ allowed: false, code: "WRONG_PASSWORD" });
      }
      // Migrate: hash and clear plaintext
      const hash = await hashPassword(password);
      await prisma.prodeRoom.update({
        where: { id: room.id },
        data: { passwordHash: hash, password: null },
      });
    }

    const userIsRegistered = await isUserRegisteredToRoom(room, user);
    if (!userIsRegistered) {
      await registerUserToRoom(room, user);
      return res.status(200).json({ allowed: true });
    }
  }

  res.status(400).send({});
}
