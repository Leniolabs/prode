import { signIn, useSession } from "next-auth/react";
import React from "react";

export function useRequireSession() {
  const session = useSession();

  React.useEffect(() => {
    if (session.status === "unauthenticated") {
      signIn("google");
    }
  }, [session]);

  return session;
}
