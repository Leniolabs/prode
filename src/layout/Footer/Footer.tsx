import React from "react";
import { className } from "@/utils/classname";

interface FooterProps {
  className?: string;
}

export function Footer(props: React.PropsWithChildren<FooterProps>) {
  return (
    <section
      className={className(
        "w-full bg-[#1f2740cc] px-[42px] py-4 m-0 flex items-center justify-between lg:px-[42px] md:px-4 sm:px-2",
        props.className
      )}
    >
      {props.children}
    </section>
  );
}
