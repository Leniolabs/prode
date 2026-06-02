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
        "bg-[#f6f5f5] w-full my-3 px-3 lg:hidden",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
