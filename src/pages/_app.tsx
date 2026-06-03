import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

type AppPageProps = AppProps["pageProps"] & {
  session?: AppProps["pageProps"] extends { session?: infer Session }
    ? Session
    : unknown;
};

export default function App({
  Component,
  pageProps,
}: AppProps<AppPageProps>) {
  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
