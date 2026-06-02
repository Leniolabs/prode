import { ProdeRoom } from "@/generated/prisma";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { Warning } from "../../common/Warning";

interface GroupsResultsWarningProps {
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

export function GroupsResultsWarning(
  props: React.PropsWithChildren<GroupsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  return (
    <Warning offset className="[&>:first-child]:hidden [&>:nth-child(2)]:flex [&>:nth-child(2)]:flex-wrap [&>:nth-child(2)]:justify-around">
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <div className="w-6 h-6 bg-[#309e3a] flex items-center justify-center text-white font-bold border border-[#233042] mr-1.5">+{props.roomConfig.pointsGoals}</div>
        {i18n.groupsExactGoals}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <div className="w-6 h-6 bg-[#0093dd] flex items-center justify-center text-white font-bold border border-[#233042] mr-1.5">+{props.roomConfig.pointsWinner}</div>
        {i18n.groupsCorrectResult}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <div className="w-6 h-6 bg-[#f9aa51] flex items-center justify-center text-white font-bold border border-[#233042] mr-1.5">+0</div>
        {i18n.groupsIncorrectPrediction}
      </div>
    </Warning>
  );
}
