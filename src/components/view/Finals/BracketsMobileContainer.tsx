import React from "react";
import { className } from "../../../utils/classname";

interface BracketsMobileContainerProps {
  className?: string;
  gridArea?: string;
}

export function BracketsMobileContainer(
  props: React.PropsWithChildren<BracketsMobileContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        // Mobile-only bracket list (hidden >= 1024px; desktop uses BracketsContainer).
        "bg-warning-bg w-full my-3 px-3 min-[1024px]:hidden"
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
