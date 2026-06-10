import React from "react";
import { className } from "../../../../utils/classname";

interface HeaderIndicatorProps {
  className?: string;

  text: React.ReactNode;
  value: React.ReactNode;

  align?: "LEFT" | "RIGHT";
  compact?: boolean;
}

export function HeaderIndicator(
  props: React.PropsWithChildren<HeaderIndicatorProps>
) {
  return (
    <div
      className={className(
        "text-white mx-[24px]",
        props.compact && "mx-[10px] flex items-baseline gap-[6px]",
        props.className
      )}
    >
      <div
        className={className(
          "font-bold",
          props.compact ? "text-[20px] leading-none" : "text-[32px] text-right",
          !props.compact && props.align === "LEFT" && "text-left"
        )}
      >
        {props.value}
      </div>
      <div
        className={className(
          "font-bold",
          props.compact ? "text-[13px]" : "text-[20px]",
          !props.compact && props.align === "LEFT" && "text-left"
        )}
      >
        {props.text}
      </div>
    </div>
  );
}
