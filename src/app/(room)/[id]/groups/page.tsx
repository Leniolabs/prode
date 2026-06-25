"use client";
import React from "react";
import { Match, ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import { RoomWelcomeBar } from "@/components/common/Header";
import { MatchInput } from "@/components/common/MatchInput";
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
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
  GroupsResultsWarning,
} from "@/components/view/Groups";
import { Meta } from "@/components/common/Meta";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import {
  DailyMatches,
  DailyMatchInput,
} from "@/components/common/DailyMatches";
import { useRouter, useParams } from "next/navigation";
import { GapIcon } from "@/components/common/Icons";
import { useQuery } from "@tanstack/react-query";
import { isGroupMatchLocked, groupMatchLockTime } from "@/utils/date";
import { GROUP_MATCHDAY_DEADLINES } from "@/config/matchdays";

type UIMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled"
> & {
  countryLeftId: string;
  userGoalsLeft?: number | null;
  disabled: boolean;
  countryRightId: string;
  userGoalsRight?: number | null;
  resultStatus: "GOALS_MATCH" | "WINNER_MATCH" | "WRONG";
};

interface Ranking extends Pick<User, "id" | "name" | "image" | "email"> {
  points: number;
  ranking: number;
  gap?: boolean;
}

interface RoomGroupsData {
  id: string;
  name: string;
  roomAdmin: boolean;
  canEditResults: boolean;
  userProdeId: string;
  room?: Pick<
    ProdeRoom,
    | "id"
    | "name"
    | "emailDomain"
    | "password"
    | "pointsGoals"
    | "pointsPenal"
    | "pointsWinner"
    | "public"
  >;
  finalsStarted: boolean;
  roundOf32Open: boolean;
  finalsBracketOpen: boolean;
  submissionEndsAt: string;
  groupsSavedAt?: string | null;
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points: number;
    ranking: number;
  };
  ranking?: (Ranking & { gap: boolean })[];
  matches?: UIMatch[];
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

type RoomGroupsResponse = RoomGroupsData & { redirect?: string };

export default function RoomGroupsPage() {
  const session = useRequireSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const i18n = useLocalizedText();
  const timezone = React.useMemo(
    () => new Date().getTimezoneOffset().toString(),
    [],
  );

  const { data: props } = useQuery<RoomGroupsResponse>({
    queryKey: ["room-groups-data", id, timezone],
    queryFn: () =>
      fetch(`/api/room-groups-data?id=${id}&timezone=${timezone}`).then((r) =>
        r.json(),
      ),
    enabled: session.status === "authenticated" && !!id,
  });
  const redirected = useBodyRedirect(props?.redirect);

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const [updating, setUpdating] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);

  React.useEffect(() => {
    if (props?.matches) {
      setMatches(props.matches);
      setOriginalMatches(props.matches);
    }
  }, [props?.matches]);

  React.useEffect(() => {
    if (props?.groupsSavedAt) setSavedAt(new Date(props.groupsSavedAt));
  }, [props?.groupsSavedAt]);

  const todayMatches = React.useMemo(() => {
    return props?.todayMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match,
    );
  }, [props?.todayMatches, matches]);
  const nextMatches = React.useMemo(() => {
    return props?.nextMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match,
    );
  }, [props?.nextMatches, matches]);

  const handleGoalsChange = React.useCallback(
    (
      matchId: string,
      userGoalsLeft: number | null,
      userGoalsRight: number | null,
    ) => {
      setMatches((matches) =>
        matches.map((match) =>
          match.id === matchId
            ? { ...match, userGoalsLeft, userGoalsRight }
            : match,
        ),
      );
    },
    [],
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      return (
        originalMatch.userGoalsLeft !== match.userGoalsLeft ||
        originalMatch.userGoalsRight !== match.userGoalsRight
      );
    });
  }, [originalMatches, matches]);

  // A match locks at its matchday's first kickoff. Saving is allowed while any
  // modified match still belongs to an open fecha; the server drops locked ones.
  const hasEditableChanges = React.useMemo(() => {
    const nowDate = new Date(now);
    return differentMatches.some(
      (match) =>
        !isGroupMatchLocked(
          new Date(match.date),
          GROUP_MATCHDAY_DEADLINES,
          nowDate,
        ),
    );
  }, [differentMatches, now]);

  const formattedGroupsTitle = React.useMemo(() => {
    const title = i18n.groupsTitle.toLowerCase();
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [i18n.groupsTitle]);

  // "Guardado 18/06 - 11.30 am" — day/month then 12-hour time with a dot separator.
  const formattedSavedAt = React.useMemo(() => {
    if (!savedAt) return null;
    const dd = String(savedAt.getDate()).padStart(2, "0");
    const mm = String(savedAt.getMonth() + 1).padStart(2, "0");
    const ampm = savedAt.getHours() >= 12 ? "pm" : "am";
    const hour = savedAt.getHours() % 12 || 12;
    const min = String(savedAt.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} - ${hour}.${min} ${ampm}`;
  }, [savedAt]);

  const hasIncompleteMatches = React.useMemo(() => {
    const nowDate = new Date(now);
    return matches.some(
      (match) =>
        !match.disabled &&
        !isGroupMatchLocked(new Date(match.date), GROUP_MATCHDAY_DEADLINES, nowDate) &&
        (match.userGoalsLeft == null || match.userGoalsRight == null)
    );
  }, [matches, now]);

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post(`/api/${id}/groups`, {
        matches: differentMatches
          .map((match) => ({
            matchId: match.id,
            goalsLeft: match.userGoalsLeft,
            goalsRight: match.userGoalsRight,
          }))
          .filter(
            (match) =>
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0),
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
        (match.userGoalsRight || match.userGoalsRight === 0),
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
    [router],
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  if (redirected) return null;

  // sectionCard: dark-navy title bar (rounded top only). Overrides the Card's
  // default brand-green title via first-child child selectors.
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
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
      </RoomWelcomeBar>
      <Container full>
        <GroupsContainer>
          <div
            className="flex flex-col gap-3 h-full min-w-0 m-0"
            style={{ gridArea: "matches-header" }}
          >
            <div className="flex flex-wrap items-stretch gap-3 min-w-0 max-[640px]:flex-col max-[640px]:items-stretch">
              <div className="bg-dark-navy text-white rounded-card text-[20px] font-semibold leading-[1.15] min-h-[50px] py-2 px-5 flex flex-wrap items-center gap-x-4 gap-y-2 flex-auto min-w-0">
                <span className="min-w-0 flex-1 truncate max-[640px]:basis-full max-[640px]:flex-none">{formattedGroupsTitle}</span>
                <div className="ml-auto flex flex-wrap items-center gap-2 shrink-0 max-[640px]:ml-0">
                  {([
                    { label: i18n.buttonLabelRoundOf32, href: `/${id}/16avos`, enabled: props?.roundOf32Open },
                    { label: i18n.buttonLabelFinalsPhase, href: `/${id}/finals`, enabled: props?.finalsBracketOpen },
                  ] as const).map(({ label, href, enabled }) =>
                    enabled ? (
                      <Link
                        key={label}
                        href={href}
                        className="inline-flex items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap transition hover:bg-white/10"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span
                        key={label}
                        className="inline-flex items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap opacity-50 pointer-events-none select-none"
                      >
                        {label}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div
                className={`rounded-card flex-none min-h-[50px] px-4 flex items-center gap-2 font-semibold text-[15px] max-[640px]:min-h-0 max-[640px]:py-[10px] ${
                  formattedSavedAt
                    ? "bg-white text-dark-navy"
                    : "bg-dark-navy text-white/70"
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
                {formattedSavedAt
                  ? `${i18n.groupsSavedLabel} ${formattedSavedAt}`
                  : i18n.groupsNotSavedLabel}
              </div>
            </div>
            {props?.room && (
              <GroupsResultsWarning
                className="w-full m-0 rounded-card min-h-[44px] bg-white/75 items-center px-4 max-[640px]:py-[10px] [&>:nth-child(2)]:w-full [&>:nth-child(2)]:min-[1024px]:flex-nowrap [&>:nth-child(2)]:min-[1024px]:justify-around [&>:nth-child(2)]:min-[1024px]:gap-4"
                roomConfig={{
                  pointsGoals: props.room.pointsGoals,
                  pointsWinner: props.room.pointsWinner,
                  pointsPenal: props.room.pointsPenal,
                }}
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
          <CardsContainer gridArea="matches">
            {[
              "GROUP_A",
              "GROUP_B",
              "GROUP_C",
              "GROUP_D",
              "GROUP_E",
              "GROUP_F",
              "GROUP_G",
              "GROUP_H",
              "GROUP_I",
              "GROUP_J",
              "GROUP_K",
              "GROUP_L",
            ].map((group) => (
              <Card
                key={group}
                className="rounded-card overflow-hidden [&>div:first-child]:!bg-white [&>div:first-child]:!text-brand-blue [&>div:first-child]:!text-[16px] [&>div:first-child]:!font-bold [&>div:first-child]:!leading-none [&>div:first-child]:!min-h-[28px] [&>div:first-child]:!py-0 [&>div:first-child]:!pt-[7px] [&>div:first-child]:!pb-[5px] [&>div:first-child]:!px-3 [&>div:first-child]:!justify-center [&>div:first-child]:uppercase [&>div:first-child]:!rounded-none"
                title={i18n[group as keyof typeof i18n]}
              >
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={
                          ["bg-[#CCDCE7]", "bg-[#D9E4ED]", "bg-[#E6EDF2]"][
                            Math.floor(index / 2)
                          ]
                        }
                        disabled={
                          match.disabled ||
                          isGroupMatchLocked(
                            new Date(match.date),
                            GROUP_MATCHDAY_DEADLINES,
                            new Date(now),
                          )
                        }
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleGoalsChange(match.id, leftGoals, rightGoals)
                        }
                        filled={match.filled}
                        userGoalsLeft={match.userGoalsLeft}
                        userGoalsRight={match.userGoalsRight}
                      />
                    ))}
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
          <div
            className="min-[1300px]:flex min-[1300px]:flex-col min-[1300px]:min-h-full"
            style={{ gridArea: "sidebar" }}
          >
            <Card
              className={`${sectionCardClass}`}
              title={
                <>
                  {todayMatches
                    ? i18n.todayMatchesLabel
                    : i18n.upcomingMatchesLabel}
                </>
              }
            >
              <CardContent>
                {(todayMatches || nextMatches)?.length ? (
                  <DailyMatches>
                    {(todayMatches || nextMatches)?.map((match) => (
                      <DailyMatchInput
                        key={match.id}
                        disabled={
                          match.disabled ||
                          isGroupMatchLocked(
                            new Date(match.date),
                            GROUP_MATCHDAY_DEADLINES,
                            new Date(now),
                          )
                        }
                        submissionEndsAt={
                          groupMatchLockTime(
                            new Date(match.date),
                            GROUP_MATCHDAY_DEADLINES,
                          )?.toISOString() ??
                          props?.submissionEndsAt ??
                          ""
                        }
                        date={new Date(match.date)}
                        today={!!todayMatches}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleGoalsChange(match.id, leftGoals, rightGoals)
                        }
                        filled={match.filled}
                        userGoalsLeft={match.userGoalsLeft}
                        userGoalsRight={match.userGoalsRight}
                      />
                    ))}
                  </DailyMatches>
                ) : (
                  <div style={{ padding: "12px", textAlign: "center" }}>
                    {i18n.noMoreMatches}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="h-4" />
            <Card
              className={`${sectionCardClass} min-[1300px]:flex-1 min-[1300px]:min-h-0 [&>:nth-child(2)]:flex-1 [&>:nth-child(3)]:mt-auto`}
              title={
                <div className="relative w-full text-left">
                  {i18n.rankingTitle}
                  <a
                    href={`/${id}/ranking`}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[13px] font-medium text-white border border-white/30 rounded-full px-3 py-1 leading-none hover:bg-white/10 hover:border-white/50 transition-colors"
                  >
                    {i18n.buttonLabelRanking}&nbsp;›
                  </a>
                </div>
              }
            >
              <CardContent>
                <Table
                  className="table-fixed w-full [&_td]:overflow-hidden [&_thead]:bg-transparent [&_thead_th]:!text-brand-blue [&_thead_th]:!text-[20px] [&_thead_th]:!font-medium capitalize"
                  columns={[
                    {
                      header: "Pos",
                      accesor: (row) =>
                        !row.gap && (
                          <UserPositionDisplay position={row.ranking} />
                        ),
                      width: "48px",
                    },
                    {
                      header: i18n.rankingNameColumn,
                      accesor: (row) =>
                        row.gap ? (
                          <GapIcon />
                        ) : (
                          <UserRankingDisplay
                            name={row.name || ""}
                            image={row.image}
                          />
                        ),
                    },
                    {
                      header: "Pts",
                      accesor: (row) => (!row.gap ? row.points : ""),
                      width: "52px",
                    },
                  ]}
                  onRowClick={handleUserClick}
                  data={props?.ranking || []}
                  clickable={(row: Ranking & { gap: boolean }) => !row.gap}
                />
              </CardContent>
              <CardFooter>
                <Button href={`/${id}/ranking`} variant="secondary" invert>
                  {i18n.buttonCompleteRanking}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </GroupsContainer>
      </Container>
      <Footer>
        <LocaleSelect />
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
