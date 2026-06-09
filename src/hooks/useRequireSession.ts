import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

export function useRequireSession() {
  const session = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (session.status === "unauthenticated") {
      // Send unauthenticated visitors to the login page so they can choose a
      // provider, rather than forcing Google. Use replace so logout doesn't
      // leave the protected page in history.
      router.replace("/login");
    }
  }, [session, router]);

  return session;
}
