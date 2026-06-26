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
// Each match sits in a 25% flex slot, so the bracket keeps 4 columns per row
// regardless of container width. The capped (default) variant sizes the card
// itself to <=210px (room-finals narrow column); `fluid` keeps the card at
// 210px but makes the slot the 25% sizing element and centers the card inside,
// so the four columns spread across a wide container (the view page) with even
// gaps instead of the card stretching to fill the slot.
const matchesRow = (fluid?: boolean) =>
  className(
    "flex flex-wrap justify-around gap-x-5 gap-y-[14px] w-full [&>*]:flex-[0_0_calc(25%-15px)] [&>*]:min-w-[170px]",
    fluid ? null : "[&>*]:max-w-[210px]"
  );

// Final + third place sit side by side with extra breathing room.
const finalPairRow = (fluid?: boolean) =>
  className(
    "flex flex-wrap justify-center gap-16 w-full [&>div]:flex-[0_0_calc(25%-15px)] [&>div]:min-w-[170px]",
    fluid ? null : "[&>div]:max-w-[210px]"
  );

interface BracketRoundProps {
  title: React.ReactNode;
  size: BracketRoundSize;
  finalPair?: boolean;
  fluid?: boolean;
  className?: string;
}

// In fluid mode wrap each match in a centering slot so the slot (not the card)
// is the 25% flex item; the card keeps its 210px size and centers, leaving the
// extra width as inter-column gaps. The slot carries the card's CSS `order` so
// the funnel column alignment is preserved.
function fluidSlots(children: React.ReactNode) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ order?: number }>(child)) return child;
    return (
      <div
        style={{ order: child.props.order ?? 0 }}
        className="flex justify-center [&>*]:max-w-[210px] [&>*]:w-full"
      >
        {child}
      </div>
    );
  });
}

export function BracketRound(
  props: React.PropsWithChildren<BracketRoundProps>
) {
  const count = React.Children.count(props.children);
  return (
    <section
      className={className(
        "flex flex-col items-center gap-3 w-full relative",
        sizeClass[props.size],
        props.className
      )}
    >
      {/* Title sits in the first match-box slot via an invisible sizer row that
          mirrors the matches layout, so it aligns above box 1 even when the
          round is under-filled (e.g. 2 semifinal boxes spread by justify-around). */}
      <div className={matchesRow(props.fluid)}>
        <div className="font-bold text-base tracking-[0.02em] whitespace-nowrap">
          {props.title}
        </div>
        {Array.from({ length: Math.max(count - 1, 0) }).map((_, i) => (
          <div key={i} aria-hidden />
        ))}
      </div>
      <div className={props.finalPair ? finalPairRow(props.fluid) : matchesRow(props.fluid)}>
        {props.fluid ? fluidSlots(props.children) : props.children}
      </div>
    </section>
  );
}
