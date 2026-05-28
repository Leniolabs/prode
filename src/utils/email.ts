import { User } from "@prisma/client";

export function getUserEmailDomain(user: User) {
  const split = (user.email || "").split("@");
  if (split[1]) return split[1];
  return "";
}
