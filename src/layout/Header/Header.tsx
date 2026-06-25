import React from "react";
import { className } from "@/utils/classname";

interface HeaderProps {
  className?: string;
}

export function Header(props: React.PropsWithChildren<HeaderProps>) {
  return (
    <header
      data-layout-header
      className={className(
        "bg-header-translucent px-[42px] mx-0 flex items-center border-b border-brand-light-blue",
        props.className
      )}
    >
      {props.children}
    </header>
  );
}
