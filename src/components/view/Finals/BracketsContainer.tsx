import React from "react";
import { className } from "../../../utils/classname";

interface BracketsContainerProps {
  className?: string;
  gridArea?: string;
}

export function BracketsContainer(
  props: React.PropsWithChildren<BracketsContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        // Desktop-only bracket tree (hidden < 1024px; mobile uses BracketsMobileContainer).
        "hidden flex-col items-center gap-[28px] w-full bg-[#f6f5f5cc] px-4 py-5 mb-3 min-[1024px]:flex"
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
