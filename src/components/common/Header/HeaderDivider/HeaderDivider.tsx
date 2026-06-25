import React from "react";
import { className } from "../../../../utils/classname";

interface HeaderDividerProps {
  className?: string;
  compact?: boolean;
}

export function HeaderDivider(
  props: React.PropsWithChildren<HeaderDividerProps>
) {
  return (
    <div
      className={className(
        "border-r border-white/50",
        props.compact ? "h-[34px]" : "h-[48px]",
        props.className
      )}
    />
  );
}
