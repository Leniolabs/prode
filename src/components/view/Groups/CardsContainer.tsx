import React from "react";
import { className } from "../../../utils/classname";

interface CardsContainerProps {
  className?: string;
  gridArea?: string;
}

export function CardsContainer(
  props: React.PropsWithChildren<CardsContainerProps>
) {
  return (
    <section
      className={className(
        "flex flex-wrap w-full items-start content-baseline",
        "min-[1024px]:[&>*]:flex-[calc(33.3%-8px)] min-[1024px]:[&>*]:max-w-[calc(33.3%-8px)] min-[1024px]:[&>*]:min-w-[calc(33.3%-8px)] min-[1024px]:[&>*]:ml-3 min-[1024px]:[&>*]:mb-3 min-[1024px]:[&>*:nth-child(3n+1)]:ml-0",
        "min-[800px]:max-[1024px]:[&>*]:flex-[calc(50%-6px)] min-[800px]:max-[1024px]:[&>*]:max-w-[calc(50%-6px)] min-[800px]:max-[1024px]:[&>*]:min-w-[calc(50%-6px)] min-[800px]:max-[1024px]:[&>*]:ml-3 min-[800px]:max-[1024px]:[&>*]:mb-3 min-[800px]:max-[1024px]:[&>*:nth-child(2n+1)]:ml-0",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
