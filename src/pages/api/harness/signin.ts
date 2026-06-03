import type { NextApiRequest, NextApiResponse } from "next";
import { encode } from "next-auth/jwt";
import { serialize } from "cookie";
import { prisma } from "../../../lib";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email : null;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "NEXTAUTH_SECRET is not set" });
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: email.split("@")[0],
      prodePublic: true,
    },
    update: {
      prodePublic: true,
    },
  });

  const token = await encode({
    secret,
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.image ?? undefined,
      userId: user.id,
    },
  });

  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  res.setHeader("Set-Cookie", [
    serialize("next-auth.session-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires,
    }),
    serialize("next-auth.callback-url", "/", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires,
    }),
  ]);

  return res.status(200).json({
    ok: true,
    email: user.email,
    token,
    cookieName: "next-auth.session-token",
  });
}
