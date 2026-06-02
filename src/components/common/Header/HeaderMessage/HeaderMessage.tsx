import React from "react";
import { className } from "../../../../utils/classname";

interface HeaderMessageProps {
  className?: string;

  title: React.ReactNode;
  subtitle?: React.ReactNode;

  prodeTitle?: React.ReactNode;
}

export function HeaderMessage(
  props: React.PropsWithChildren<HeaderMessageProps>
) {
  return (
    <div className={className("text-white mr-auto py-3", props.className)}>
      <div className="text-2xl font-bold flex select-none">{props.title} </div>
      {props.subtitle && (
        <div className="text-base select-none">{props.subtitle}</div>
      )}
      {props.prodeTitle && (
        <div className="text-2xl flex m-auto items-center select-none [&_span]:text-[#69b29a] [&_span]:flex [&_span]:items-center [&_span]:ml-[5px]">
          {props.prodeTitle}
        </div>
      )}
    </div>
  );
}
