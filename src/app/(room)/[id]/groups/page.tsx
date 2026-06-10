'use client'
import React from "react";
import { Match, ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { CountryFlag } from "@/components/common/CountryFlag";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import { RoomWelcomeBar } from "@/components/common/Header";
import { MatchInput } from "@/components/common/MatchInput";
import { Modal } from "@/components/common/Modal";
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
import { useBodyRedirect, useCountries, useRequireSession } from "@/hooks";
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
  room?: Pick<ProdeRoom, "id" | "name" | "emailDomain" | "password" | "pointsGoals" | "pointsPenal" | "pointsWinner" | "public">;
  finalsStarted: boolean;
  submissionEndsAt: string;
  userRanking?: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"> & {
    points: number; ranking: number;
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
  const countries = useCountries();
  const timezone = React.useMemo(() => new Date().getTimezoneOffset().toString(), []);

  const { data: props } = useQuery<RoomGroupsResponse>({ queryKey: ["room-groups-data", id, timezone], queryFn: () => fetch(`/api/room-groups-data?id=${id}&timezone=${timezone}`).then((r) => r.json()), enabled: session.status === "authenticated" && !!id });
  const redirected = useBodyRedirect(props?.redirect);

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const [updating, setUpdating] = React.useState(false);
  const [savingResult, setSavingResult] = React.useState(false);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);
  const [editingMatchId, setEditingMatchId] = React.useState<string | null>(null);
  const [adminGoalsLeft, setAdminGoalsLeft] = React.useState("");
  const [adminGoalsRight, setAdminGoalsRight] = React.useState("");

  React.useEffect(() => {
    if (props?.matches) {
      setMatches(props.matches);
      setOriginalMatches(props.matches);
    }
  }, [props?.matches]);

  const todayMatches = React.useMemo(() => {
    return props?.todayMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match
    );
  }, [props?.todayMatches, matches]);
  const nextMatches = React.useMemo(() => {
    return props?.nextMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match
    );
  }, [props?.nextMatches, matches]);

  const handleGoalsChange = React.useCallback(
    (matchId: string, userGoalsLeft: number | null, userGoalsRight: number | null) => {
      setMatches((matches) =>
        matches.map((match) =>
          match.id === matchId ? { ...match, userGoalsLeft, userGoalsRight } : match
        )
      );
    },
    []
  );

  const editingMatch = React.useMemo(() => {
    return editingMatchId
      ? matches.find((match) => match.id === editingMatchId) ?? null
      : null;
  }, [editingMatchId, matches]);

  const editingLeftCountry = React.useMemo(() => {
    return countries?.find((country) => country.id === editingMatch?.countryLeftId);
  }, [countries, editingMatch?.countryLeftId]);

  const editingRightCountry = React.useMemo(() => {
    return countries?.find((country) => country.id === editingMatch?.countryRightId);
  }, [countries, editingMatch?.countryRightId]);

  const openResultEditor = React.useCallback((match: UIMatch) => {
    setEditingMatchId(match.id);
    setAdminGoalsLeft(match.goalsLeft === null ? "" : String(match.goalsLeft));
    setAdminGoalsRight(match.goalsRight === null ? "" : String(match.goalsRight));
  }, []);

  const closeResultEditor = React.useCallback(() => {
    if (savingResult) return;
    setEditingMatchId(null);
    setAdminGoalsLeft("");
    setAdminGoalsRight("");
  }, [savingResult]);

  const canSaveAdminResult = React.useMemo(() => {
    return adminGoalsLeft !== "" && adminGoalsRight !== "";
  }, [adminGoalsLeft, adminGoalsRight]);

  const handleSaveResult = React.useCallback(() => {
    if (!editingMatch) return;

    const goalsLeft = Number(adminGoalsLeft);
    const goalsRight = Number(adminGoalsRight);
    if (!Number.isFinite(goalsLeft) || !Number.isFinite(goalsRight)) return;

    setSavingResult(true);
    axios
      .post("/api/admin/groups", {
        matches: [
          {
            id: editingMatch.id,
            goalsLeft,
            goalsRight,
          },
        ],
      })
      .then(() => {
        setMatches((currentMatches) =>
          currentMatches.map((match) =>
            match.id === editingMatch.id
              ? {
                  ...match,
                  goalsLeft,
                  goalsRight,
                  filled: true,
                }
              : match
          )
        );
        closeResultEditor();
      })
      .finally(() => setSavingResult(false));
  }, [adminGoalsLeft, adminGoalsRight, closeResultEditor, editingMatch]);

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
        !isGroupMatchLocked(new Date(match.date), GROUP_MATCHDAY_DEADLINES, nowDate)
    );
  }, [differentMatches, now]);

  const formattedGroupsTitle = React.useMemo(() => {
    const title = i18n.groupsTitle.toLowerCase();
    return title.charAt(0).toUpperCase() + title.slice(1);
  }, [i18n.groupsTitle]);

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
              (match.goalsRight || match.goalsRight === 0)
          ),
      })
      .then(() => {
        setOriginalMatches(matches);
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

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  if (redirected) return null;

  // sectionCard: dark-navy title bar (rounded top only). Overrides the Card's
  // default brand-green title via first-child child selectors.
  const sectionCardClass =
    "self-start [&>div:first-child]:!bg-dark-navy [&>div:first-child]:!text-white [&>div:first-child]:!text-[20px] [&>div:first-child]:!font-semibold [&>div:first-child]:!leading-[1.15] [&>div:first-child]:!min-h-[40px] [&>div:first-child]:!py-0 [&>div:first-child]:!pt-[11px] [&>div:first-child]:!pb-[13px] [&>div:first-child]:!px-5 [&>div:first-child]:!rounded-b-none [&>div:first-child]:!rounded-t-card";

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
        <Button disabled={!props?.finalsStarted} invert href={`/${id}/finals`}>
          {i18n.buttonLabelFinalsPhase}
        </Button>
      </RoomWelcomeBar>
      <Container full>
        <GroupsContainer>
          <div
            className="flex flex-wrap h-full items-stretch gap-3 min-w-0 m-0 max-[640px]:flex-col max-[640px]:items-stretch"
            style={{ gridArea: "matches-header" }}
          >
            <div className="bg-dark-navy text-white rounded-card text-[20px] font-semibold leading-[1.15] min-h-[50px] px-5 flex items-center flex-auto min-w-0">
              {formattedGroupsTitle}
            </div>
            {props?.room && (
              <GroupsResultsWarning
                className="h-full m-0 rounded-card flex-none min-h-[50px] bg-white/75 items-center px-4 max-[640px]:h-auto max-[640px]:min-h-0 max-[640px]:py-[10px] [&>:nth-child(2)]:min-[1024px]:flex-nowrap [&>:nth-child(2)]:min-[1024px]:justify-between [&>:nth-child(2)]:min-[1024px]:gap-4"
                roomConfig={{
                  pointsGoals: props.room.pointsGoals,
                  pointsWinner: props.room.pointsWinner,
                  pointsPenal: props.room.pointsPenal,
                }}
              />
            )}
            <div className="flex flex-none min-h-[50px] max-[640px]:min-h-0">
              <Button
                variant="transparent"
                disabled={!hasEditableChanges}
                className="ml-auto !bg-accent-cta !text-dark-navy !border-accent-cta !text-[20px] min-h-[50px] justify-center disabled:!bg-accent-cta disabled:!text-dark-navy disabled:!border-accent-cta max-[640px]:w-full"
                onClick={handleSave}
              >
                {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
              </Button>
            </div>
          </div>
          <CardsContainer gridArea="matches">
            {[
              "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "GROUP_F",
              "GROUP_G", "GROUP_H", "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
            ].map((group) => (
              <Card
                key={group}
                className="rounded-card overflow-hidden [&>div:first-child]:!bg-white [&>div:first-child]:!text-brand-blue [&>div:first-child]:!text-[16px] [&>div:first-child]:!font-bold [&>div:first-child]:!leading-none [&>div:first-child]:!min-h-[28px] [&>div:first-child]:!py-0 [&>div:first-child]:!pt-[7px] [&>div:first-child]:!pb-[5px] [&>div:first-child]:!px-3 [&>div:first-child]:!justify-start [&>div:first-child]:uppercase [&>div:first-child]:!rounded-none"
                title={i18n[group as keyof typeof i18n]}
              >
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={
                          ["bg-[#f6f5f5]", "bg-[#ededed]", "bg-[#e1e1e1]"][
                            Math.floor(index / 2)
                          ]
                        }
                        disabled={match.disabled || isGroupMatchLocked(new Date(match.date), GROUP_MATCHDAY_DEADLINES, new Date(now))}
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleGoalsChange(match.id, leftGoals, rightGoals)
                        }
                        onEditResult={props?.canEditResults ? () => openResultEditor(match) : undefined}
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
              className={sectionCardClass}
              title={
                <>
                  {todayMatches ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel}
                </>
              }
            >
              <CardContent>
                {(todayMatches || nextMatches)?.length ? (
                  <DailyMatches>
                    {(todayMatches || nextMatches)?.map((match) => (
                      <DailyMatchInput
                        key={match.id}
                        disabled={match.disabled || isGroupMatchLocked(new Date(match.date), GROUP_MATCHDAY_DEADLINES, new Date(now))}
                        submissionEndsAt={groupMatchLockTime(new Date(match.date), GROUP_MATCHDAY_DEADLINES)?.toISOString() ?? props?.submissionEndsAt ?? ""}
                        date={new Date(match.date)}
                        today={!!todayMatches}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleGoalsChange(match.id, leftGoals, rightGoals)
                        }
                        onEditResult={props?.canEditResults ? () => openResultEditor(match) : undefined}
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
            <Card
              className={`${sectionCardClass} min-[1300px]:flex-1 min-[1300px]:min-h-0 [&>:nth-child(2)]:flex-1 [&>:nth-child(3)]:mt-auto`}
              title={i18n.rankingTitle}
            >
              <CardContent>
                <Table
                  className="table-fixed w-full [&_td]:overflow-hidden [&_thead]:bg-transparent [&_thead_th]:!text-brand-blue [&_thead_th]:!text-[20px] [&_thead_th]:!font-medium"
                  columns={[
                    {
                      header: "Pos",
                      accesor: (row) => !row.gap && <UserPositionDisplay position={row.ranking} />,
                      width: "48px",
                    },
                    {
                      header: "Jugador",
                      accesor: (row) =>
                        row.gap ? (
                          <GapIcon />
                        ) : (
                          <UserRankingDisplay name={row.name || ""} image={row.image} />
                        ),
                    },
                    {
                      header: "Pts",
                      accesor: (row) => (!row.gap ? row.points : ""),
                      align: "RIGHT",
                      width: "52px",
                    },
                  ]}
                  onRowClick={handleUserClick}
                  data={props?.ranking || []}
                  clickable={(row: Ranking & { gap: boolean }) => !row.gap}
              />
            </CardContent>
            <CardFooter>
              <Button
                href={`/${id}/ranking`}
                variant="secondary"
                className="!text-brand-light-blue !border-2 !border-brand-light-blue !bg-transparent !text-[20px] !font-semibold"
              >
                {i18n.buttonCompleteRanking}
              </Button>
            </CardFooter>
            </Card>
          </div>
        </GroupsContainer>
      </Container>
      {props?.canEditResults && editingMatch && (
        <Modal
          title={editingMatch.filled ? "Update result" : "Set result"}
          onClose={closeResultEditor}
        >
          <div className="grid gap-[14px] min-w-[min(100%,280px)]">
            <div className="flex items-center justify-center gap-[10px]">
              <div className="inline-flex items-center gap-2 min-w-0 text-[16px] font-bold">
                <CountryFlag code={editingLeftCountry?.code} />
                <span>{editingLeftCountry?.shortName ?? editingLeftCountry?.name ?? ""}</span>
              </div>
              <span className="text-white/70 text-[12px] font-bold tracking-[0.12em] uppercase">vs</span>
              <div className="inline-flex items-center gap-2 min-w-0 text-[16px] font-bold">
                <CountryFlag code={editingRightCountry?.code} />
                <span>{editingRightCountry?.shortName ?? editingRightCountry?.name ?? ""}</span>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center [&_input]:w-full [&_input]:min-w-0 [&_input]:py-2 [&_input]:px-[10px] [&_input]:border [&_input]:border-white/15 [&_input]:rounded-[10px] [&_input]:bg-white/[0.04] [&_input]:text-inherit [&_input]:text-center [&_input]:text-[16px] [&_input]:font-bold">
              <input
                min={0}
                max={99}
                type="number"
                inputMode="decimal"
                value={adminGoalsLeft}
                onChange={(event) => setAdminGoalsLeft(event.target.value)}
              />
              <span>-</span>
              <input
                min={0}
                max={99}
                type="number"
                inputMode="decimal"
                value={adminGoalsRight}
                onChange={(event) => setAdminGoalsRight(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeResultEditor} disabled={savingResult}>
                Cancel
              </Button>
              <Button onClick={handleSaveResult} disabled={!canSaveAdminResult || savingResult}>
                {savingResult ? "Saving" : editingMatch.filled ? "Update result" : "Set result"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
