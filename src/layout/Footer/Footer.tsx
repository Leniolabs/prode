import React from "react";
import { className } from "@/utils/classname";

interface FooterProps {
  className?: string;
  dark?: boolean;
}

export function Footer(props: React.PropsWithChildren<FooterProps>) {
  return (
    <section
      className={className(
        "w-full px-[42px] py-4 m-0 shrink-0 flex items-center justify-end",
        "max-lg:px-4 max-[512px]:px-2 max-[512px]:py-2",
        props.dark ? "bg-dark-navy" : "bg-footer-gradient",
        props.className
      )}
    >
      {props.children}
    </section>
  );
}
