import React from "react";
import { useLocalizedText } from "@/locale";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import { MatchFinalsInput } from "@/components/common/MatchFinalsInput";
import { getFinalsStageGroup } from "@/utils/finals";
import { finalsTierLockTime, isFinalsMatchLocked } from "@/utils/date";
import { FINALS_TIER_DEADLINES } from "@/config/matchdays";
import { BracketsContainer } from "./BracketsContainer";
import { BracketRound } from "./BracketRound";

export interface FinalsBracketMatch {
  id: string;
  date: Date | string;
  stage: string;
  filled?: boolean;
  disabled?: boolean;
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
  now: number;
  onChange: (id: string) => (value: MatchChangeValue) => void;
  /** Admin mode: editable country pickers + result inputs (sets references). */
  admin?: boolean;
}

const stageNum = (stage: string) =>
  parseInt(stage.slice(stage.lastIndexOf("_") + 1), 10) || 0;

export function FinalsBracket({
  matches,
  now,
  onChange,
  admin,
}: FinalsBracketProps) {
  const i18n = useLocalizedText();

  // Each match locks at its knockout tier's first kickoff; the tier deadline
  // drives the per-input countdown. Mirrors the group fecha lock.
  const lockNow = new Date(now);

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
  ) => {
    // CSS flex order within the round (visual sequence). Tab order is handled by
    // natural DOM order — MatchFinalsInput no longer sets explicit tabindex.
    const order = index + 1;
    return admin ? (
      <MatchFinalsInput
        key={match.id}
        date={new Date(match.date)}
        countryLeftId={match.countryLeftId}
        goalsLeft={match.goalsLeft ?? undefined}
        countryRightId={match.countryRightId}
        goalsRight={match.goalsRight ?? undefined}
        penaltisLeft={match.penaltisLeft ?? null}
        penaltisRight={match.penaltisRight ?? null}
        onChange={(value) =>
          onChange(match.id)({
            countryLeftId: value.countryLeftId,
            goalsLeft: value.goalsLeft,
            countryRightId: value.countryRightId,
            goalsRight: value.goalsRight,
            penaltisLeft: value.penaltisLeft ?? null,
            penaltisRight: value.penaltisRight ?? null,
          })
        }
        countryInput
        order={order}
      />
    ) : (
    <UserMatchFinalsInput
      key={match.id}
      showCountryStatus={advanced}
      highlight={match.stage === "FINALS"}
      disabled={match.disabled || isFinalsMatchLocked(match.stage, FINALS_TIER_DEADLINES, lockNow)}
      submissionEndsAt={finalsTierLockTime(match.stage, FINALS_TIER_DEADLINES)?.toISOString() ?? ""}
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
      order={order}
      filled={match.filled}
    />
  );
  };

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
