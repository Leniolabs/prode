import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import { prisma } from "../../../lib";
import { randomBytes } from "crypto";

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

  // Auth.js 5 uses database sessions. Create a session directly in the DB.
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.upsert({
    where: { sessionToken },
    create: {
      sessionToken,
      userId: user.id,
      expires,
    },
    update: { expires },
  });

  res.setHeader("Set-Cookie", [
    serialize("authjs.session-token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires,
    }),
    serialize("authjs.callback-url", "/", {
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
    sessionToken,
    cookieName: "authjs.session-token",
  });
}
