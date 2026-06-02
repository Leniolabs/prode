import { ProdeRoom } from "@/generated/prisma";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { Warning } from "../../common/Warning";

interface FinalsResultsWarningProps {
  roomConfig: Pick<ProdeRoom, "pointsGoals" | "pointsPenal" | "pointsWinner">;
}

export function FinalsResultsWarning(
  props: React.PropsWithChildren<FinalsResultsWarningProps>
) {
  const i18n = useLocalizedText();

  const Box = ({ color, children }: { color: string; children: React.ReactNode }) => (
    <div className={`w-6 h-6 relative flex items-center justify-center text-white font-bold z-[1] border border-[#233042] mr-1.5 ${color}`}>
      {children}
    </div>
  );

  return (
    <Warning offset className="[&>:first-child]:hidden [&>:nth-child(2)]:flex [&>:nth-child(2)]:flex-wrap [&>:nth-child(2)]:justify-around">
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <Box color="bg-[#309e3a]">
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#309e3a] border border-[#233042] border-r-0 border-b-0 z-[-1]" />
          +{props.roomConfig.pointsPenal}
        </Box>
        {i18n.finalsExactPrediction}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <Box color="bg-[#309e3a]">
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#0093dd] border border-[#233042] border-r-0 border-b-0 z-[-1]" />
          +{props.roomConfig.pointsGoals + props.roomConfig.pointsWinner}
        </Box>
        {i18n.finalsExactGoals} + {i18n.finalsCorrectResult}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <Box color="bg-[#309e3a]">+{props.roomConfig.pointsGoals}</Box>
        {i18n.finalsExactGoals}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <Box color="bg-[#0093dd]">+{props.roomConfig.pointsWinner}</Box>
        <Box color="bg-[#0093dd]">
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#0093dd] border border-[#233042] border-r-0 border-b-0 z-[-1]" />
          +{props.roomConfig.pointsWinner}
        </Box>
        {i18n.finalsCorrectResult}
      </div>
      <div className="flex items-center my-1.5 [&+div]:ml-3">
        <Box color="bg-[#f9aa51]">+0</Box>
        <Box color="bg-[#f9aa51]">
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#f9aa51] border border-[#233042] border-r-0 border-b-0 z-[-1]" />
          +0
        </Box>
        {i18n.finalsIncorrectPrediction}
      </div>
    </Warning>
  );
}
