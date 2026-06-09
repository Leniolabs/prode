import React from "react";
import { useRouter } from "next/navigation";

export function useBodyRedirect(redirect?: string | null) {
  const router = useRouter();

  React.useEffect(() => {
    if (redirect) {
      router.push(redirect);
    }
  }, [redirect, router]);

  return !!redirect;
}
