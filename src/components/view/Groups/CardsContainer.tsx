import React from "react";
import { className } from "../../../utils/classname";

interface CardsContainerProps {
  className?: string;
  gridArea?: string;
}

export function CardsContainer(
  props: React.PropsWithChildren<CardsContainerProps>,
) {
  return (
    <section
      className={className(
        // Grid items default to min-width:auto (min-content), which lets a wide
        // child (MatchInput) force the track — and the whole page — past 100vw.
        // [&>*]:min-w-0 allows the cards to shrink to the track instead.
        "grid w-full grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 items-start content-start [&>*]:min-w-0",
        props.className,
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
