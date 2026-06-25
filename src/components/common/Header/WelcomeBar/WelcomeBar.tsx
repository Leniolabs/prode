import React from "react";
import Image from "next/image";
import Link from "next/link";

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
    <div className="relative z-[1] flex flex-nowrap items-center gap-3 border-b border-brand-light-blue bg-[#005596] px-[26px] pb-[14px] pt-3 max-[640px]:gap-2 max-[640px]:px-[14px] max-[640px]:pt-3 max-[640px]:pb-9">
      {/* Trophy logo navigates back to the landing page. */}
      <Link href="/" className="flex-shrink-0" aria-label="Prode">
        <Image
          src="/wc2026-trophy.png"
          alt=""
          aria-hidden="true"
          width={115}
          height={289}
          className="!h-[54px] !w-auto max-[640px]:!h-[44px]"
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="truncate text-[22px] font-bold leading-[1.2] text-white max-[640px]:text-[17px]">
          {title}
        </div>
        <div className="truncate text-[15px] text-white opacity-[0.96] max-[640px]:text-[12px]">
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
        <div className="ml-auto flex-shrink-0">{children}</div>
      )}
    </div>
  );
}
