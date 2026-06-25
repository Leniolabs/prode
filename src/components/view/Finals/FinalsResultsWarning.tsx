import { ProdeRoom } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Warning } from "../../common/Warning";

interface FinalsResultsWarningProps {
  className?: string;
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

// Layout for the indicator chip row (Warning's second child). Hides the Warning
// icon (first child) and turns the content into a wrapping/justified flex row.
// Mirrors GroupsResultsWarning: desktop collapses to a single nowrap strip.
const warningLayout = className(
  "[&>*:first-child]:hidden",
  "[&>*:nth-child(2)]:flex [&>*:nth-child(2)]:flex-wrap",
  "[&>*:nth-child(2)]:[place-content:space-around] [&>*:nth-child(2)]:gap-x-6 [&>*:nth-child(2)]:gap-y-[10px]",
  "min-[1024px]:[&>*:nth-child(2)]:flex-nowrap min-[1024px]:[&>*:nth-child(2)]:items-center",
  "min-[1024px]:[&>*:nth-child(2)]:justify-between min-[1024px]:[&>*:nth-child(2)]:gap-3"
);

// Each indicator: chip(s) + label. Mobile may wrap; desktop forces nowrap.
const indicator =
  "flex items-center gap-1.5 text-[#112632] text-xs min-[1024px]:flex-nowrap min-[1024px]:whitespace-nowrap";

// The chip itself: compact rounded badge with white bold text.
const chip =
  "flex items-center place-content-center min-w-[24px] h-6 px-[6px] box-border rounded-[4px] text-white text-xs font-bold";

export function FinalsResultsWarning(
  props: React.PropsWithChildren<FinalsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className={className(warningLayout, props.className)}>
      <div className={indicator}>
        <div className={className(chip, "bg-correct")}>
          +{props.roomConfig.pointsPenal}
        </div>
        {i18n.finalsExactPrediction}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-correct")}>
          +{props.roomConfig.pointsGoals}
        </div>
        <div className={className(chip, "bg-winner")} />
        {i18n.finalsExactGoals} + {i18n.finalsCorrectResult}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-correct")}>
          +{props.roomConfig.pointsGoals}
        </div>
        {i18n.finalsExactGoals}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-winner")}>
          +{props.roomConfig.pointsWinner}
        </div>
        {i18n.finalsCorrectResult}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-wrong")}>+0</div>
        {i18n.finalsIncorrectPrediction}
      </div>
    </Warning>
  );
}
