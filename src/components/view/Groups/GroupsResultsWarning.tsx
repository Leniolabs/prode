import { ProdeRoom } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Warning } from "../../common/Warning";

interface GroupsResultsWarningProps {
  className?: string;
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

// Layout for the indicator chip row (Warning's second child). Hides the Warning
// icon (first child) and turns the content into a wrapping/justified flex row.
const warningLayout = className(
  // first child = the Warning icon container → hidden
  "[&>*:first-child]:hidden",
  // second child = the content div → flex-wrap row of indicator chips
  "[&>*:nth-child(2)]:flex [&>*:nth-child(2)]:flex-wrap",
  "[&>*:nth-child(2)]:[place-content:space-around] [&>*:nth-child(2)]:gap-x-6 [&>*:nth-child(2)]:gap-y-[10px]",
  // desktop (>=1024px): single row, no wrap, space-between
  "min-[1024px]:[&>*:nth-child(2)]:flex-nowrap min-[1024px]:[&>*:nth-child(2)]:items-center",
  "min-[1024px]:[&>*:nth-child(2)]:justify-between min-[1024px]:[&>*:nth-child(2)]:gap-3"
);

// Each indicator: chip + label. Mobile may wrap; desktop forces nowrap.
const indicator =
  "flex items-center gap-2 text-[#112632] text-xs min-[1024px]:flex-nowrap min-[1024px]:whitespace-nowrap";

// The chip itself.
const chip =
  "flex items-center place-content-center min-w-[24px] h-6 px-[6px] box-border rounded-[4px] text-[#112632] text-xs font-bold";

export function GroupsResultsWarning(
  props: React.PropsWithChildren<GroupsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className={className(warningLayout, props.className)}>
      <div className={indicator}>
        <div className={className(chip, "bg-brand-green")}>
          +{props.roomConfig.pointsGoals}
        </div>
        {i18n.groupsExactGoals}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-brand-light-blue")}>
          +{props.roomConfig.pointsWinner}
        </div>
        {i18n.groupsCorrectResult}
      </div>
      <div className={indicator}>
        <div className={className(chip, "bg-accent-cta")}>+0</div>
        {i18n.groupsIncorrectPrediction}
      </div>
       <div className={indicator}>
        <div className={className(chip, "bg-white border-red-500 border-2")}> </div>
        {i18n.groupsIncomplete}
      </div>
    </Warning>
  );
}
