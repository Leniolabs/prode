import React from "react";
import { className } from "../../../utils/classname";

interface BracketTitleProps {
  className?: string;
  full?: boolean;
  order: number;
}

export function BracketTitle(
  props: React.PropsWithChildren<BracketTitleProps>
) {
  return (
    <section
      className={className(
        "flex font-bold text-base items-center mb-1.5",
        props.full && "min-w-[calc(100%-12px)]",
        props.className
      )}
      style={{ order: props.order }}
    >
      {props.children}
    </section>
  );
}
