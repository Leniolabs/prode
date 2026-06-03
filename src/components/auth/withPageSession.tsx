import React from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

type SessionPageProps = {
  session?: Session | null;
};

export function withPageSession<P extends object>(
  Page: React.ComponentType<P>
) {
  function SessionWrappedPage(props: P & SessionPageProps) {
    return (
      <SessionProvider session={props.session}>
        <Page {...(props as P)} />
      </SessionProvider>
    );
  }

  SessionWrappedPage.displayName = `withPageSession(${
    Page.displayName || Page.name || "Page"
  })`;

  return SessionWrappedPage;
}
