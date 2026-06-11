'use client'
import React from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Layout, Footer } from "@/layout";
import { Button } from "@/components/common/Button";
import { GoogleIcon, MicrosoftIcon } from "@/components/common/Icons";

export default function LoginPage() {
  const session = useSession();
  const router = useRouter();
  const error =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error")
      : null;

  React.useEffect(() => {
    if (session.status === "authenticated") {
      router.push("/rooms");
    }
  }, [session.status, router]);

  return (
    <Layout>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="flex flex-col items-center gap-[clamp(36px,7vh,70px)] w-full max-w-[396px]">
          <Image
            src="/mundial_2026.png"
            alt="FIFA World Cup 2026"
            width={279}
            height={430}
            priority
            className="w-[min(279px,46vw)] h-auto max-h-[40vh] object-contain"
          />
          <div className="flex flex-col items-center gap-[33px] w-full max-w-[396px]">
            <div className="flex flex-col items-center text-center text-white">
              <p className="font-bold text-[clamp(56px,14vw,80px)] leading-none">
                Prode
              </p>
              <p className="font-medium text-[20px] uppercase mt-1">
                (Sports Lottery)
              </p>
            </div>

            {session.status === "authenticated" ? (
              <Button href="/rooms">Entrar</Button>
            ) : (
              <>
                <div className="flex items-center gap-2 w-full">
                  <span className="flex-1 h-px bg-white/50" />
                  <span className="text-white text-[28px] leading-none">
                    Login
                  </span>
                  <span className="flex-1 h-px bg-white/50" />
                </div>

                {error === "OAuthAccountNotLinked" && (
                  <p className="text-red-300 text-sm text-center">
                    Por favor, ingresa con la cuenta original que registraste
                    este mail para validar tu cuenta.
                  </p>
                )}

                <div className="flex flex-col gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/rooms" })}
                    className="bg-white rounded-[10px] h-[58px] w-full px-6 shadow-[0px_0px_1.5px_rgba(0,0,0,0.08),0px_2px_1.5px_rgba(0,0,0,0.17)] flex items-center justify-center gap-3 cursor-pointer hover:bg-[#f8f9fa]"
                  >
                    <span className="flex items-center [&_svg]:h-6 [&_svg]:w-6">
                      <GoogleIcon />
                    </span>
                    <span className="font-medium text-[20px] text-black/[0.54]">
                      Sign In with Google
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => signIn("azure-ad", { callbackUrl: "/rooms" })}
                    className="bg-white rounded-[10px] h-[58px] w-full px-6 shadow-[0px_0px_1.5px_rgba(0,0,0,0.08),0px_2px_1.5px_rgba(0,0,0,0.17)] flex items-center justify-center gap-3 cursor-pointer hover:bg-[#f8f9fa]"
                  >
                    <span className="flex items-center [&_svg]:h-6 [&_svg]:w-6">
                      <MicrosoftIcon />
                    </span>
                    <span className="font-medium text-[20px] text-black/[0.54]">
                      Sign In with Microsoft
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer dark className="!bg-brand-blue">
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
