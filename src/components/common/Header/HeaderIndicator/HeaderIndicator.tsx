import React from "react";
import { className } from "../../../../utils/classname";

interface HeaderIndicatorProps {
  className?: string;

  text: React.ReactNode;
  value: React.ReactNode;

  align?: "LEFT" | "RIGHT";
}

export function HeaderIndicator(
  props: React.PropsWithChildren<HeaderIndicatorProps>
) {
  const leftAlign = props.align === "LEFT";
  return (
    <div
      className={className("text-white mx-6", props.className)}
    >
      <div className={className("text-3xl font-bold", leftAlign ? "text-left" : "text-right")}>{props.value}</div>
      <div className={className("text-xl font-bold", leftAlign ? "text-left" : "text-left")}>{props.text}</div>
    </div>
  );
}
