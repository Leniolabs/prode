import React from "react";
import { className } from "../../../utils/classname";

type BracketRoundSize = "16" | "8" | "4" | "2" | "final";

// Layered grays matching the groups page, deepening as the bracket funnels.
// Sets the --finals-card-bg CSS var consumed by UserMatchFinalsInput.
const sizeClass: Record<BracketRoundSize, string> = {
  "16": "[--finals-card-bg:#f6f5f5]",
  "8": "[--finals-card-bg:#ededed]",
  "4": "[--finals-card-bg:#e1e1e1]",
  "2": "[--finals-card-bg:#e1e1e1]",
  final: "[--finals-card-bg:#e1e1e1]",
};

// Uniform, readable match boxes. Each round centers its matches, so the tree
// funnels by row count (16 -> 8 -> 4 -> 2 -> final) while box size stays fixed.
const matchesRow =
  "flex flex-wrap justify-center gap-x-5 gap-y-[14px] w-full [&>*]:flex-[0_0_calc(25%-15px)] [&>*]:max-w-[calc(25%-15px)] [&>*]:min-w-[170px]";

// Final + third place sit side by side with extra breathing room.
const finalPairRow =
  "flex flex-wrap justify-center gap-16 w-full [&>div]:flex-[0_0_calc(25%-15px)] [&>div]:max-w-[calc(25%-15px)] [&>div]:min-w-[170px]";

interface BracketRoundProps {
  title: React.ReactNode;
  size: BracketRoundSize;
  finalPair?: boolean;
  className?: string;
}

export function BracketRound(
  props: React.PropsWithChildren<BracketRoundProps>
) {
  return (
    <section
      className={className(
        "flex flex-col items-center gap-3 w-full relative",
        sizeClass[props.size],
        props.className
      )}
    >
      <div className="self-start font-bold text-base tracking-[0.02em]">
        {props.title}
      </div>
      <div className={props.finalPair ? finalPairRow : matchesRow}>
        {props.children}
      </div>
    </section>
  );
}
