import { ProdeRoom } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Warning } from "../../common/Warning";

interface FinalsResultsWarningProps {
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

// Layout for the indicator chip row (Warning's second child). Hides the Warning
// icon (first child) and lays the chips out as a wrapping, space-around row.
const warningLayout = className(
  "[&>*:first-child]:hidden",
  "[&>*:nth-child(2)]:flex [&>*:nth-child(2)]:flex-wrap [&>*:nth-child(2)]:[place-content:space-around]"
);

// Each indicator: chip(s) + label. Consecutive indicators get a left gap.
const indicator =
  "flex items-center my-[6px] [&+&]:ml-3";

// The chip box: bordered square with white bold text.
const indicatorBox =
  "w-6 h-6 relative mr-[6px] flex items-center place-content-center text-white font-bold z-[1] border border-[#233042]";

export function FinalsResultsWarning(
  props: React.PropsWithChildren<FinalsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className={warningLayout}>
      <div className={indicator}>
        <div className={className(indicatorBox, "bg-correct")}>
          +{props.roomConfig.pointsPenal}
        </div>
        {i18n.finalsExactPrediction}
      </div>
      <div className={indicator}>
        <div className={className(indicatorBox, "bg-correct")}>
          +{props.roomConfig.pointsGoals}
        </div>
        <div className={className(indicatorBox, "bg-winner")} />
        {i18n.finalsExactGoals} + {i18n.finalsCorrectResult}
      </div>
      <div className={indicator}>
        <div className={className(indicatorBox, "bg-correct")}>
          +{props.roomConfig.pointsGoals}
        </div>
        {i18n.finalsExactGoals}
      </div>
      <div className={indicator}>
        <div className={className(indicatorBox, "bg-winner")}>
          +{props.roomConfig.pointsWinner}
        </div>
        {i18n.finalsCorrectResult}
      </div>
      <div className={indicator}>
        <div className={className(indicatorBox, "bg-wrong")}>+0</div>
        {i18n.finalsIncorrectPrediction}
      </div>
    </Warning>
  );
}
