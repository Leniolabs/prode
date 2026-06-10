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
        props.className,
        "flex font-bold text-base items-center mb-[6px]",
        props.full && "min-w-[calc(100%-12px)]"
      )}
      style={{ order: props.order }}
    >
      {props.children}
    </section>
  );
}
