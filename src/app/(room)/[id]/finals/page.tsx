'use client'
import React from "react";
import { Match, ProdeRoom, Stage, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { RoomWelcomeBar } from "@/components/common/Header";
import { Warning } from "@/components/common/Warning";
import { Table } from "@/components/common/Table";
import { UserPositionDisplay } from "@/components/common/UserPositionDisplay";
import { UserRankingDisplay } from "@/components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  CardFooter,
  CardContent,
} from "@/layout";
import { useBodyRedirect, useRequireSession } from "@/hooks";
import { useInterval } from "@/hooks/useInterval";
import { filterUniquePredicate } from "@/utils/array";
import axios from "axios";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import {
  BracketsMobileContainer,
  FinalsBracket,
  FinalsContainer,
  FinalsResultsWarning,
} from "@/components/view/Finals";
import {
  Collapsable,
  CollapsableContainer,
} from "@/components/common/Collapsable";
import { Meta } from "@/components/common/Meta";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import {
  DailyMatches,
  DailyMatchFinalInput,
} from "@/components/common/DailyMatches";
import { ShareToday } from "@/components/common/ShareButton/ShareToday";
import { GapIcon } from "@/components/common/Icons";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getFinalsStageGroup, getMatchOrder } from "@/utils/finals";
import { finalsMatchLockTime, isFinalsMatchLocked } from "@/utils/date";

const usesPredictedFinalists = (stage: string) => {
  const group = getFinalsStageGroup(stage);
  return group === "FINALS_4" || group === "FINALS_2" || group === "FINAL";
};

type UIMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled" | "penaltisLeft" | "penaltisRight"
> & {
  countryLeftId?: string;
  userCountryLeftId?: string;
  userGoalsLeft?: number | null;
  userPenaltisLeft?: number | null;
  disabled: boolean;
  countryRightId?: string;
  userCountryRightId?: string;
  userGoalsRight?: number | null;
  userPenaltisRight?: number | null;
  resultStatus: "GOALS_MATCH" | "WINNER_MATCH" | "WRONG";
  countryStatus: "MATCH" | "WRONG";
};

interface Ranking extends Pick<User, "id" | "name" | "image" | "email"> {
  points: number;
  ranking: number;
  gap?: boolean;
}

interface RoomFinalsData {
  id: string;
  name: string;
  roomAdmin: boolean;
  userProdeId: string;
  room?: Pick<ProdeRoom, "id" | "name" | "emailDomain" | "password" | "pointsGoals" | "pointsPenal" | "pointsWinner" | "public">;
  submissionEndsAt: string;
  finalsSavedAt?: string | null;
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"> & {
    points: number; ranking: number;
  };
  ranking: (Ranking & { gap: boolean })[];
  matches: UIMatch[];
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

type RoomFinalsResponse = RoomFinalsData & { redirect?: string };


export default function RoomFinalsPage() {
  const session = useRequireSession();
  const i18n = useLocalizedText();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const timezone = React.useMemo(() => new Date().getTimezoneOffset().toString(), []);

  const { data: props } = useQuery<RoomFinalsResponse>({ queryKey: ["room-finals-data", "finals", id, timezone], queryFn: () => fetch(`/api/room-finals-data?id=${id}&timezone=${timezone}&phase=finals`).then((r) => r.json()), enabled: session.status === "authenticated" && !!id });
  const redirected = useBodyRedirect(props?.redirect);

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);

  // Finals lock per match at kickoff (mirrors the group rule). A match's input
  // is disabled once it has started; its own kickoff drives the countdown shown
  // on each input.
  const lockNow = React.useMemo(() => new Date(now), [now]);
  const isLocked = React.useCallback(
    (dateIso: string | Date) => isFinalsMatchLocked(new Date(dateIso), lockNow),
    [lockNow]
  );
  const tierDeadline = React.useCallback(
    (dateIso: string | Date) => finalsMatchLockTime(new Date(dateIso)).toISOString(),
    []
  );

  const [updating, setUpdating] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);

  React.useEffect(() => {
    if (props?.matches) {
      setMatches(props.matches);
      setOriginalMatches(props.matches);
    }
  }, [props?.matches]);

  React.useEffect(() => {
    if (props?.finalsSavedAt) setSavedAt(new Date(props.finalsSavedAt));
  }, [props?.finalsSavedAt]);

  const todayMatches = React.useMemo(() => {
    return props?.todayMatches?.map((match) => matches.find((m) => m.id === match.id) || match);
  }, [props?.todayMatches, matches]);
  const nextMatches = React.useMemo(() => {
    return props?.nextMatches?.map((match) => matches.find((m) => m.id === match.id) || match);
  }, [props?.nextMatches, matches]);

  const handleMatchChange = React.useCallback(
    (matchId: string) => (value: {
      countryLeftId: string | undefined;
      goalsLeft: number | null;
      countryRightId: string | undefined;
      goalsRight: number | null;
      penaltisLeft: number | null;
      penaltisRight: number | null;
    }) => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                userCountryLeftId: value.countryLeftId,
                userGoalsLeft: value.goalsLeft ?? null,
                userCountryRightId: value.countryRightId,
                userGoalsRight: value.goalsRight ?? null,
                userPenaltisLeft: value.penaltisLeft ?? null,
                userPenaltisRight: value.penaltisRight ?? null,
              }
            : match
        )
      );
    },
    []
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      return (
        originalMatch.userGoalsLeft !== match.userGoalsLeft ||
        originalMatch.userGoalsRight !== match.userGoalsRight ||
        originalMatch.userPenaltisLeft !== match.userPenaltisLeft ||
        originalMatch.userPenaltisRight !== match.userPenaltisRight
      );
    });
  }, [originalMatches, matches]);

  // Saving is allowed while any modified match still belongs to an open tier;
  // the server drops locked ones (getAllowedFinalMatchesToModify).
  const hasEditableChanges = React.useMemo(
    () => differentMatches.some((match) => !isLocked(match.date)),
    [differentMatches, isLocked]
  );

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post(`/api/${id}/finals`, {
        matches: differentMatches
          .map((match) => ({
            matchId: match.id,
            goalsLeft: match.userGoalsLeft,
            goalsRight: match.userGoalsRight,
            countryLeftId: match.userCountryLeftId,
            countryRightId: match.userCountryRightId,
            penaltisLeft: match.userPenaltisLeft,
            penaltisRight: match.userPenaltisRight,
          }))
          .filter(
            (match) =>
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0)
          ),
      })
      .then(() => {
        setOriginalMatches(matches);
        setSavedAt(new Date());
        setTimeout(() => setUpdating(false), 500);
      });
  }, [id, differentMatches, matches]);

  React.useEffect(() => {
    if (updating || !hasEditableChanges) return;

    const matchesToSave = differentMatches.filter(
      (match) =>
        (match.userGoalsLeft || match.userGoalsLeft === 0) &&
        (match.userGoalsRight || match.userGoalsRight === 0)
    );

    if (matchesToSave.length === 0) return;

    const timeout = window.setTimeout(() => {
      handleSave();
    }, 800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [differentMatches, handleSave, hasEditableChanges, updating]);

  const handleUserClick = React.useCallback(
    (row: Ranking) => {
      if (row && row.id) router.push(`/${row.id}/view`);
    },
    [router]
  );

  const formattedFinalsTitle = React.useMemo(() => {
    const title = i18n.finalsTitle.toLowerCase();
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [i18n.finalsTitle]);

  // Warn when an unlocked knockout match with a known matchup (real or
  // user-predicted teams) is missing a score prediction.
  const hasIncompleteMatches = React.useMemo(() => {
    return matches.some((match) => {
      if (match.disabled || isLocked(match.date)) return false;
      const hasMatchup =
        (match.userCountryLeftId ?? match.countryLeftId) &&
        (match.userCountryRightId ?? match.countryRightId);
      return (
        !!hasMatchup &&
        (match.userGoalsLeft == null || match.userGoalsRight == null)
      );
    });
  }, [matches, isLocked]);

  // "Guardado 18/06 - 11.30 am" — matches the groups page chip format.
  const formattedSavedAt = React.useMemo(() => {
    if (!savedAt) return null;
    const dd = String(savedAt.getDate()).padStart(2, "0");
    const mm = String(savedAt.getMonth() + 1).padStart(2, "0");
    const ampm = savedAt.getHours() >= 12 ? "pm" : "am";
    const hour = savedAt.getHours() % 12 || 12;
    const min = String(savedAt.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} - ${hour}.${min} ${ampm}`;
  }, [savedAt]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  if (redirected) return null;

  // sectionCard: dark-navy title bar (rounded top only). Mirrors the groups page.
  const sectionCardClass =
    "self-start [&>div:first-child]:!bg-dark-navy [&>div:first-child]:!text-white [&>div:first-child]:!text-[20px] [&>div:first-child]:!font-semibold [&>div:first-child]:!leading-[1.15] [&>div:first-child]:!min-h-[40px] [&>div:first-child]:!py-0 [&>div:first-child]:!pt-[11px] [&>div:first-child]:!pb-[13px] [&>div:first-child]:!px-5 [&>div:first-child]:!rounded-b-none [&>div:first-child]:!rounded-t-card [&>div:first-child]:!justify-start [&>div:first-child]:!text-left";

  return (
    <Layout>
      <Meta />
      <RoomWelcomeBar
        id={props?.id}
        name={props?.name}
        room={props?.room}
        userRanking={props?.userRanking}
        roomAdmin={props?.roomAdmin}
      >
        <Button invert href={`/rooms`}>{i18n.buttonLabelProdeList}</Button>
      </RoomWelcomeBar>
      <Container full>
        <FinalsContainer>
          <div
            className="flex flex-col gap-3 h-full min-w-0 m-0"
            style={{ gridArea: "matches-header" }}
          >
            <div className="flex flex-wrap items-stretch gap-3 min-w-0 max-[640px]:flex-col max-[640px]:items-stretch">
              <div className="bg-dark-navy text-white rounded-card text-[20px] font-semibold leading-[1.15] min-h-[50px] py-2 px-5 flex flex-wrap items-center gap-x-4 gap-y-2 flex-auto min-w-0">
                <span className="min-w-0 flex-1 truncate max-[640px]:basis-full max-[640px]:flex-none">{formattedFinalsTitle}</span>
                <div className="ml-auto flex flex-wrap items-center gap-2 shrink-0 max-[640px]:ml-0">
                  {([
                    { label: i18n.buttonLabelGroupPhase, href: `/${id}/groups` },
                    { label: i18n.buttonLabelRoundOf32, href: `/${id}/16avos` },
                  ] as const).map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="inline-flex items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap transition hover:bg-white/10"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div
                className={`rounded-card flex-none min-h-[50px] px-4 flex items-center gap-2 font-semibold text-[15px] max-[640px]:min-h-0 max-[640px]:py-[10px] ${
                  formattedSavedAt ? "bg-white text-dark-navy" : "bg-dark-navy text-white/70"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {formattedSavedAt ? `${i18n.groupsSavedLabel} ${formattedSavedAt}` : i18n.groupsNotSavedLabel}
              </div>
            </div>
            {props?.room && (
              <FinalsResultsWarning
                className="w-full m-0 rounded-card min-h-[44px] bg-white/75 items-center px-4 max-[640px]:py-[10px] [&>:nth-child(2)]:w-full [&>:nth-child(2)]:min-[1024px]:flex-nowrap [&>:nth-child(2)]:min-[1024px]:justify-around [&>:nth-child(2)]:min-[1024px]:gap-4"
                roomConfig={props.room}
              />
            )}
            {hasIncompleteMatches && (
              <Warning
                offset
                iconClassName="text-red-500"
                className="w-full m-0 rounded-card min-h-[44px] items-center px-4 text-[14px] font-medium max-[640px]:py-[10px] border-2 border-red-500"
              >
                {i18n.groupsIncompleteWarning}
              </Warning>
            )}
          </div>
          <FinalsBracket
            matches={matches}
            now={now}
            onChange={handleMatchChange}
            includeRoundOf32={false}
            fluid
          />
          <BracketsMobileContainer gridArea="matches">
            <CollapsableContainer>
              <Collapsable title={i18n.FINALS_8}>
                {matches.filter((x) => x.stage.includes("FINALS_8_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput disabled={match.disabled || isLocked(match.date)} submissionEndsAt={tierDeadline(match.date)}
                    key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                    userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1 + 16} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_4}>
                {matches.filter((x) => x.stage.includes("FINALS_4_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput showCountryStatus disabled={match.disabled || isLocked(match.date)} submissionEndsAt={tierDeadline(match.date)}
                    key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                    userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1 + 16 + 8} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_2}>
                {matches.filter((x) => x.stage.includes("FINALS_2_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput showCountryStatus key={match.id} disabled={match.disabled || isLocked(match.date)}
                    submissionEndsAt={tierDeadline(match.date)} date={new Date(match.date)}
                    userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                    userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                    penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1 + 16 + 8 + 4} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINAL}>
                {matches.filter((x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE").sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput showCountryStatus disabled={match.disabled || isLocked(match.date)}
                    submissionEndsAt={tierDeadline(match.date)} key={match.id} date={new Date(match.date)}
                    userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                    userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                    penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)}
                    order={index + 1 + 16 + 8 + 4 + 2} filled={match.filled} highlight={match.stage === "FINALS"} />
                ))}
              </Collapsable>
            </CollapsableContainer>
          </BracketsMobileContainer>
          <Card className={sectionCardClass} title={<>{todayMatches ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel}<ShareToday userProdeId={props?.userProdeId} /></>} gridArea="following">
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchFinalInput disabled={match.disabled || isLocked(match.date)}
                      submissionEndsAt={tierDeadline(match.date)} key={match.id} today={!!todayMatches}
                      date={new Date(match.date)} userCountryLeftId={usesPredictedFinalists(match.stage) ? match.userCountryLeftId : match.countryLeftId}
                      userGoalsLeft={match.userGoalsLeft} userCountryRightId={usesPredictedFinalists(match.stage) ? match.userCountryRightId : match.countryRightId}
                      userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight} goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage) + 100} filled={match.filled} />
                  ))}
                </DailyMatches>
              ) : (
                <div style={{ padding: "12px", textAlign: "center" }}>{i18n.noMoreMatches}</div>
              )}
            </CardContent>
          </Card>
          <Card
            className={sectionCardClass}
            gridArea="ranking"
            title={
              <>
                {i18n.rankingTitle}
                <a
                  href={`/${id}/ranking`}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-white border border-white/30 rounded-full px-3 py-1 leading-none hover:bg-white/10 hover:border-white/50 transition-colors"
                >
                  {i18n.buttonLabelRanking}&nbsp;›
                </a>
              </>
            }
          >
            <CardContent>
              <Table
                className="table-fixed w-full [&_td]:overflow-hidden [&_thead]:bg-transparent [&_thead_th]:!text-brand-blue [&_thead_th]:!text-[20px] [&_thead_th]:!font-medium capitalize"
                onRowClick={handleUserClick}
                columns={[
                  { header: "Pos", accesor: (row) => !row.gap && <UserPositionDisplay position={row.ranking} />, width: "48px" },
                  { header: i18n.rankingNameColumn, accesor: (row) => row.gap ? <GapIcon /> : <UserRankingDisplay name={row.name || ""} image={row.image} /> },
                  { header: "Pts", accesor: (row) => (!row.gap ? row.points : ""), width: "52px" },
                ]}
                data={props?.ranking || []}
                clickable={(row: Ranking & { gap: boolean }) => !row.gap}
              />
            </CardContent>
            <CardFooter>
              <Button href={`/${id}/ranking`} variant="secondary" invert>{i18n.buttonCompleteRanking}</Button>
            </CardFooter>
          </Card>
        </FinalsContainer>
      </Container>
      <Footer>
        <LocaleSelect />
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
