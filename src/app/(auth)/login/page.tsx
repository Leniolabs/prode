'use client'
import React from "react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Layout, Footer, Container } from "@/layout";
import { Button } from "@/components/common/Button";
import Image from "next/image";
import { Register } from "@/components/view/Index";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      <Container direction="COL" className="justify-center !pb-0 min-h-0">
        <div className="flex justify-center mb-4">
          <Image
            src="/mundial_2026.png"
            alt="FIFA World Cup 2026"
            width={279}
            height={430}
            style={{ height: 'min(280px, 32vh)', width: 'auto', borderRadius: '20px' }}
          />
        </div>
        <h1 className="text-white font-extrabold text-[clamp(48px,9vh,80px)] text-center leading-none m-0 mb-[0.25em] break-words max-w-[90vw]">
          Prode
        </h1>
        <p className="text-white text-[20px] tracking-[0.12em] text-center m-0 mb-[1.5em] opacity-[0.85] font-medium">
          (SPORTS LOTTERY)
        </p>
        {session.status === "unauthenticated" && (
          <Register authError={error ?? undefined} />
        )}
        {session.status === "authenticated" && (
          <Button href="/rooms">Entrar</Button>
        )}
      </Container>
      <Footer dark className="!bg-brand-blue">
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
