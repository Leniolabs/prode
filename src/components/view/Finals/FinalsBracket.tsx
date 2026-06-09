import React from "react";
import { useLocalizedText } from "@/locale";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import { getFinalsStageGroup } from "@/utils/finals";
import { BracketsContainer } from "./BracketsContainer";
import { BracketRound } from "./BracketRound";

export interface FinalsBracketMatch {
  id: string;
  date: Date | string;
  stage: string;
  filled?: boolean;
  disabled: boolean;
  goalsLeft: number | null;
  goalsRight: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
  countryLeftId?: string;
  countryRightId?: string;
  userCountryLeftId?: string;
  userCountryRightId?: string;
  userGoalsLeft?: number | null;
  userGoalsRight?: number | null;
  userPenaltisLeft?: number | null;
  userPenaltisRight?: number | null;
}

interface MatchChangeValue {
  countryLeftId: string | undefined;
  goalsLeft: number | null;
  countryRightId: string | undefined;
  goalsRight: number | null;
  penaltisLeft: number | null;
  penaltisRight: number | null;
}

interface FinalsBracketProps {
  matches: FinalsBracketMatch[];
  submissionEndsAt: string;
  submissionsEnded: boolean;
  onChange: (id: string) => (value: MatchChangeValue) => void;
}

const stageNum = (stage: string) =>
  parseInt(stage.slice(stage.lastIndexOf("_") + 1), 10) || 0;

export function FinalsBracket({
  matches,
  submissionEndsAt,
  submissionsEnded,
  onChange,
}: FinalsBracketProps) {
  const i18n = useLocalizedText();

  const byGroup = (group: string) =>
    matches
      .filter((m) => getFinalsStageGroup(m.stage) === group)
      .sort((a, b) => stageNum(a.stage) - stageNum(b.stage));

  // FINALS_16 / FINALS_8 show the real qualified teams; FINALS_4 onward show the
  // user-predicted advancing teams and the country-correctness status.
  const renderMatch = (
    match: FinalsBracketMatch,
    index: number,
    advanced: boolean
  ) => (
    <UserMatchFinalsInput
      key={match.id}
      showCountryStatus={advanced}
      highlight={match.stage === "FINALS"}
      disabled={match.disabled || submissionsEnded}
      submissionEndsAt={submissionEndsAt}
      date={new Date(match.date)}
      userCountryLeftId={advanced ? match.userCountryLeftId : match.countryLeftId}
      userCountryRightId={advanced ? match.userCountryRightId : match.countryRightId}
      userGoalsLeft={match.userGoalsLeft}
      userGoalsRight={match.userGoalsRight}
      userPenaltisLeft={match.userPenaltisLeft}
      userPenaltisRight={match.userPenaltisRight}
      penaltisLeft={match.penaltisLeft}
      penaltisRight={match.penaltisRight}
      goalsLeft={match.goalsLeft}
      goalsRight={match.goalsRight}
      countryLeftId={match.countryLeftId}
      countryRightId={match.countryRightId}
      onChange={onChange(match.id)}
      order={index + 1}
      filled={match.filled}
    />
  );

  const finalPair = matches
    .filter((m) => m.stage === "FINALS" || m.stage === "THIRD_PLACE")
    .sort((a, b) => (a.stage > b.stage ? 1 : -1));

  return (
    <BracketsContainer gridArea="matches">
      <BracketRound size="16" title={i18n.FINALS_16}>
        {byGroup("FINALS_16").map((m, i) => renderMatch(m, i, false))}
      </BracketRound>
      <BracketRound size="8" title={i18n.FINALS_8}>
        {byGroup("FINALS_8").map((m, i) => renderMatch(m, i, false))}
      </BracketRound>
      <BracketRound size="4" title={i18n.FINALS_4}>
        {byGroup("FINALS_4").map((m, i) => renderMatch(m, i, true))}
      </BracketRound>
      <BracketRound size="2" title={i18n.FINALS_2}>
        {byGroup("FINALS_2").map((m, i) => renderMatch(m, i, true))}
      </BracketRound>
      <BracketRound size="final" finalPair title={`${i18n.FINAL} · ${i18n.THIRD_PLACE}`}>
        {finalPair.map((m, i) => renderMatch(m, i, true))}
      </BracketRound>
    </BracketsContainer>
  );
}
