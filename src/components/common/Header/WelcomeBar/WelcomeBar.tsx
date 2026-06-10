import React from "react";
import Image from "next/image";

interface WelcomeBarProps {
  title: string;
  deadlinePre?: string;
  deadlinePost?: string;
  prodeEnd?: string | null;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
  });
}

export function WelcomeBar({
  title,
  deadlinePre,
  deadlinePost,
  prodeEnd,
  subtitle,
  children,
}: WelcomeBarProps) {
  return (
    <div className="relative z-[1] flex items-center gap-[14px] border-none bg-[#015697] px-[26px] pb-[14px] pt-3 max-[640px]:flex-wrap max-[640px]:items-start max-[640px]:px-[14px] max-[640px]:py-3">
      <Image
        src="/wc2026-trophy.png"
        alt=""
        aria-hidden="true"
        width={115}
        height={289}
        className="!h-[54px] !w-auto flex-shrink-0 max-[640px]:!h-[48px]"
      />
      <div className="flex flex-col gap-0.5">
        <div className="text-[22px] font-bold leading-[1.2] text-white max-[640px]:text-[18px]">
          {title}
        </div>
        <div className="text-[15px] text-white opacity-[0.96] max-[640px]:text-[13px]">
          {subtitle ??
            (prodeEnd ? (
              <>
                {deadlinePre}{" "}
                <span className="font-bold text-[#FFCA30]">
                  {formatDeadline(prodeEnd)}
                </span>{" "}
                {deadlinePost}
              </>
            ) : null)}
        </div>
      </div>
      {children && (
        <div className="ml-auto flex-shrink-0 max-[640px]:ml-0 max-[640px]:w-full">
          {children}
        </div>
      )}
    </div>
  );
}
