import React from "react";
import Image from "next/image";
import { useLocalizedText } from "@/locale";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import { MatchFinalsInput } from "@/components/common/MatchFinalsInput";
import { getFinalsStageGroup, getFinalsStageOrder } from "@/utils/finals";
import { finalsTierLockTime, isFinalsMatchLocked } from "@/utils/date";
import { FINALS_TIER_DEADLINES } from "@/config/matchdays";
import { BracketsContainer } from "./BracketsContainer";
import { BracketRound } from "./BracketRound";
import { BracketIcon } from "./BracketIcon";

// Connector "llaves" between two rounds: one funnel per match in the lower
// round, column-aligned to the match boxes so each Y points at the game its
// winners advance to. Count = number of matches in the round below.
function BracketConnectors({ count }: { count: number }) {
  return (
    <div
      aria-hidden
      className="flex flex-wrap justify-around gap-x-5 w-full -my-2 [&>svg]:flex-[0_0_calc(25%-15px)] [&>svg]:max-w-[210px] [&>svg]:min-w-[170px] [&>svg]:h-[18px]"
    >
      {Array.from({ length: count }).map((_, i) => (
        <BracketIcon key={i} />
      ))}
    </div>
  );
}

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
  /**
   * Render the Round of 32 (FINALS_16) as the top bracket row. Defaults to
   * true. The room finals page sets this false because the Round of 32 lives
   * on its own `/16avos` matrix page; the bracket there starts at Octavos.
   */
  includeRoundOf32?: boolean;
}

const stageNum = (stage: string) =>
  parseInt(stage.slice(stage.lastIndexOf("_") + 1), 10) || 0;

export function FinalsBracket({
  matches,
  now,
  onChange,
  admin,
  includeRoundOf32 = true,
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
    // CSS flex order within the round (visual sequence). Driven by
    // FINAL_ORDER_MAP so each match sits in the bracket column above the match
    // it feeds (e.g. FINALS_8_1 + FINALS_8_2 stack above FINALS_4_1). A naive
    // index+1 breaks that alignment for the Cuartos onward.
    const order = getFinalsStageOrder(match.stage) || index + 1;
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

  const finalMatch = matches.find((m) => m.stage === "FINALS");
  const thirdMatch = matches.find((m) => m.stage === "THIRD_PLACE");

  return (
    <BracketsContainer gridArea="matches">
      {includeRoundOf32 && (
        <>
          <BracketRound size="16" title={i18n.FINALS_16}>
            {byGroup("FINALS_16").map((m, i) => renderMatch(m, i, false))}
          </BracketRound>
          <BracketConnectors count={8} />
        </>
      )}
      <BracketRound size="8" title={i18n.FINALS_8}>
        {byGroup("FINALS_8").map((m, i) => renderMatch(m, i, false))}
      </BracketRound>
      <BracketConnectors count={4} />
      <BracketRound size="4" title={i18n.FINALS_4}>
        {byGroup("FINALS_4").map((m, i) => renderMatch(m, i, true))}
      </BracketRound>
      <BracketConnectors count={2} />
      <BracketRound size="2" title={i18n.FINALS_2}>
        {byGroup("FINALS_2").map((m, i) => renderMatch(m, i, true))}
      </BracketRound>
      <BracketConnectors count={2} />
      <section className="flex flex-col items-center gap-4 w-full [--finals-card-bg:#e1e1e1]">
        <div className="font-bold text-base tracking-[0.02em]">{i18n.FINAL}</div>
        {finalMatch && (
          <div className="flex items-center justify-center gap-4 rounded-card border border-[#c9d4e3] bg-white/70 p-4">
            <Image
              src="/copita.svg"
              alt=""
              aria-hidden
              width={145}
              height={177}
              className="shrink-0 rounded-[8px]"
            />
            <div className="w-[210px] min-w-[180px]">
              {renderMatch(finalMatch, 0, true)}
            </div>
          </div>
        )}
        <div className="w-full max-w-[520px] border-t border-[#c9d4e3]" />
        <div className="font-bold text-base tracking-[0.02em]">
          {i18n.THIRD_PLACE}
        </div>
        {thirdMatch && (
          <div className="w-[210px] min-w-[180px]">
            {renderMatch(thirdMatch, 1, true)}
          </div>
        )}
      </section>
    </BracketsContainer>
  );
}
