import Image from "next/image";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Footer, Layout } from "@/layout";

export default function NotFound() {
  return (
    <Layout className="justify-between overflow-hidden">
      <main className="flex-1 relative min-h-0 w-[min(100%,1512px)] mx-auto overflow-hidden max-[768px]:flex max-[768px]:flex-col max-[768px]:justify-center max-[768px]:items-center max-[768px]:gap-6 max-[768px]:py-8">
        <div className="absolute left-[-24px] bottom-0 w-[min(620px,41vw)] aspect-[662/947] max-h-[84vh] max-[1024px]:left-[-16px] max-[1024px]:w-[min(480px,42vw)] max-[768px]:relative max-[768px]:order-2 max-[768px]:left-auto max-[768px]:w-[min(100%,420px)]">
          <Image
            src="/card.svg"
            alt="Yellow card illustration"
            width={662}
            height={947}
            priority
            className="block w-full h-auto"
          />
        </div>
        <div className="absolute top-1/2 left-[58%] -translate-x-1/2 -translate-y-1/2 flex flex-col gap-6 ml-4 text-white text-left max-[1024px]:left-[56%] max-[1024px]:gap-4 max-[768px]:order-1 max-[768px]:relative max-[768px]:left-auto max-[768px]:top-auto max-[768px]:translate-x-0 max-[768px]:translate-y-0 max-[768px]:ml-0 max-[768px]:w-[calc(100%-48px)] max-[768px]:text-center">
          <h1 className="m-0 text-[128px] font-bold leading-none max-[1024px]:text-[96px] max-[768px]:text-[72px]">
            404
          </h1>
          <p className="m-0 text-[64px] font-normal leading-[1.1] max-[1024px]:text-[48px] max-[768px]:text-[36px]">
            Ups, algo salió mal
          </p>
        </div>
      </main>
      <Footer dark className="!bg-brand-blue">
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
