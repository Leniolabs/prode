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
    <div className={className(props.className, "text-white mr-auto py-3")}>
      <div className="text-[24px] font-bold flex select-none">{props.title} </div>
      {props.subtitle && (
        <div className="text-[16px] [line-break:normal] select-none">{props.subtitle}</div>
      )}
      {props.prodeTitle && (
        <div className="text-[24px] [&_span]:text-brand-green [&_span]:flex [&_span]:items-center [&_span]:ml-[5px] flex mx-auto items-center select-none">
          {props.prodeTitle}
        </div>
      )}
    </div>
  );
}
