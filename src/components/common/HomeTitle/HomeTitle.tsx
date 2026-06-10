import React from "react";
import { className } from "../../../utils/classname";

interface HomeTitleProps {
  className?: string;
}

export function HomeTitle(props: React.PropsWithChildren<HomeTitleProps>) {
  return (
    <div
      className={className(
        "text-white font-bold text-[80px] text-center leading-none break-words max-w-[90vw]",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}
