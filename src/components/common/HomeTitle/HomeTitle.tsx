import React from "react";
import { className } from "../../../utils/classname";

interface HomeTitleProps {
  className?: string;
}

export function HomeTitle(props: React.PropsWithChildren<HomeTitleProps>) {
  return (
    <div
      className={className(
        "bg-[#354156] text-white font-bold text-5xl px-9 py-3 mb-[1em] mt-[1em] shadow-[5px_5px_0px_0px_#ffca30] whitespace-nowrap",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}
