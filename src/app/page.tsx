'use client'
import React from "react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Layout, Footer, Container } from "@/layout";
import { Button } from "@/components/common/Button";
import { HomeTitle } from "@/components/common/HomeTitle";
import Image from "next/image";
import { LeniCamel, Register } from "@/components/view/Index";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LocaleSelect } from "@/components/common/LocaleSelect";

export default function Home() {
  const session = useSession();
  const router = useRouter();
  const error = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error") as "OAuthAccountNotLinked" | null
    : null;

  React.useEffect(() => {
    if (session.status === "authenticated") {
      router.push("/rooms");
    }
  }, [session.status, router]);

  return (
    <Layout>
      <Container direction="COL">
        <Image src="/qatar.png" alt="Qatar Logo" width={200} height={200} />
        <HomeTitle>Lenio Prode</HomeTitle>
        {session.status === "unauthenticated" && (
          <Register authError={error ?? undefined} />
        )}
        {session.status === "authenticated" && (
          <Button href="/rooms">Entrar</Button>
        )}
        <LeniCamel />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
