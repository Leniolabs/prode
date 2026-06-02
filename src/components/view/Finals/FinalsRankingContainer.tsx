import React from "react";
import { className } from "../../../utils/classname";

interface FinalsRankingContainerProps {
  className?: string;
}

export function FinalsRankingContainer(
  props: React.PropsWithChildren<FinalsRankingContainerProps>
) {
  return (
    <section
      className={className(
        "min-w-[30%] max-w-[30%] max-[1300px]:min-w-full max-[1300px]:max-w-full",
        "[&>section>div:nth-child(2)]:flex [&>section>div:nth-child(2)]:flex-col",
        "[&_a]:max-w-max [&_a]:mx-auto [&_a]:my-6",
        props.className
      )}
    >
      {props.children}
    </section>
  );
}
