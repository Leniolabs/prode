import React from "react";
import { className } from "@/utils/classname";

interface HeaderProps {
  className?: string;
}

export function Header(props: React.PropsWithChildren<HeaderProps>) {
  return (
    <header
      className={className(
        "bg-[#1F2740CC] px-[42px] py-0 m-0 flex items-center",
        props.className
      )}
    >
      {props.children}
    </header>
  );
}
