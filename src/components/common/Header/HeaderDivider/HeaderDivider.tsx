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
        "border-r-2 border-white",
        props.compact ? "h-[34px]" : "h-[70px]",
        props.className
      )}
    />
  );
}
