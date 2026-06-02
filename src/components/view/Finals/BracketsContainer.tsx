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
        "hidden lg:flex flex-row flex-wrap w-full bg-[#f6f5f5cc] p-3 pr-0 mb-3",
        "[&>*]:flex-[calc(25%-12px)] [&>*]:max-w-[calc(25%-12px)] [&>*]:min-w-[calc(25%-12px)] [&>*]:mr-3 [&>*]:mb-3",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
