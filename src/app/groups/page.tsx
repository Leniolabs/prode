'use client'
import React from "react";
import { Match, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { CountryFlag } from "@/components/common/CountryFlag";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import { RoomWelcomeBar } from "@/components/common/Header";
import { MatchInput } from "@/components/common/MatchInput";
import { Modal } from "@/components/common/Modal";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useCountries, useRequireSession } from "@/hooks";
import { useInterval } from "@/hooks/useInterval";
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
} from "@/components/view/Groups";
import { Warning } from "@/components/common/Warning";
import Link from "next/link";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import {
  DailyMatches,
  DailyMatchInput,
} from "@/components/common/DailyMatches";
import { useQuery } from "@tanstack/react-query";
import { isGroupMatchLocked, groupMatchLockTime } from "@/utils/date";
import { GROUP_MATCHDAY_DEADLINES } from "@/config/matchdays";

const stageHeaderClass =
  "mb-[18px] [&>:first-child]:bg-brand-green [&>:first-child]:text-white [&>:first-child]:rounded-card [&>:first-child]:text-[25px] [&>:first-child]:font-bold [&>:first-child]:leading-[1.15] [&>:first-child]:pt-[11px] [&>:first-child]:px-5 [&>:first-child]:pb-[13px] [&>:first-child]:normal-case";
const sectionCardClass =
  "[&>:first-child]:bg-brand-green [&>:first-child]:text-white [&>:first-child]:rounded-t-[8px] [&>:first-child]:text-[25px] [&>:first-child]:font-bold [&>:first-child]:leading-[1.15] [&>:first-child]:min-h-[40px] [&>:first-child]:pt-[11px] [&>:first-child]:px-5 [&>:first-child]:pb-[13px] [&>:first-child]:normal-case";
const groupCardClass =
  "rounded-card overflow-hidden [&>:first-child]:bg-white [&>:first-child]:text-brand-blue [&>:first-child]:text-[16px] [&>:first-child]:font-bold [&>:first-child]:leading-none [&>:first-child]:min-h-[28px] [&>:first-child]:px-3 [&>:first-child]:pt-[7px] [&>:first-child]:pb-[5px] [&>:first-child]:uppercase";
const matchPairBg = ["bg-[#f6f5f5]", "bg-[#ededed]", "bg-[#e1e1e1]"];

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

interface GroupsData {
  submissionEndsAt: string;
  groupsStarted: boolean;
  finalsStarted: boolean;
  canEditResults: boolean;
  matches?: UIMatch[];
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark">;
  userProdeId: string;
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

export default function GroupsPage() {
  const session = useRequireSession();
  const i18n = useLocalizedText();
  const countries = useCountries();
  const timezone = React.useMemo(() => new Date().getTimezoneOffset().toString(), []);

  const { data: props } = useQuery<GroupsData>({ queryKey: ["groups-page-data", timezone], queryFn: () => fetch(`/api/groups-page-data?timezone=${timezone}`).then((r) => r.json()), enabled: session.status === "authenticated" });

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
    (id: string, userGoalsLeft: number | null, userGoalsRight: number | null) => {
      setMatches((matches) =>
        matches.map((match) =>
          match.id === id ? { ...match, userGoalsLeft, userGoalsRight } : match
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
      .post(`/api/groups`, {
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
  }, [differentMatches, matches]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout>
      <RoomWelcomeBar userRanking={props?.userRanking}>
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
        <Button disabled={!props?.finalsStarted} invert href={`/finals`}>
          {i18n.buttonLabelFinalsPhase}
        </Button>
      </RoomWelcomeBar>
      <Warning offset>
        {i18n.groupsWarning}{" "}
        <Link href="/rooms">{i18n.groupsWarningLink}</Link>
        .
      </Warning>

      <Container full>
        <GroupsContainer full>
          <ContainerHeader
            sticky
            className={stageHeaderClass}
            title={formattedGroupsTitle}
            gridArea="matches-header"
          >
            <Button
              variant="transparent"
              disabled={!hasEditableChanges}
              className="ml-auto"
              onClick={handleSave}
            >
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
          <CardsContainer gridArea="matches">
            {[
              "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "GROUP_F",
              "GROUP_G", "GROUP_H", "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
            ].map((group) => (
              <Card
                key={group}
                className={groupCardClass}
                title={i18n[group as keyof typeof i18n]}
              >
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={matchPairBg[Math.floor(index / 2)]}
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

          <Card
            className={sectionCardClass}
            title={
              <>
                {todayMatches
                  ? i18n.todayMatchesLabel
                  : i18n.upcomingMatchesLabel}
              </>
            }
            gridArea="sidebar"
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
                      countryLeftId={match.countryLeftId}
                      today={!!todayMatches}
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
        </GroupsContainer>
      </Container>
      {props?.canEditResults && editingMatch && (
        <Modal
          title={editingMatch.filled ? "Update result" : "Set result"}
          onClose={closeResultEditor}
        >
          <div className="grid gap-[14px] min-w-[min(100%,280px)]">
            <div className="flex items-center justify-center gap-2.5">
              <div className="inline-flex items-center gap-2 min-w-0 text-[16px] font-bold">
                <CountryFlag code={editingLeftCountry?.code} />
                <span>{editingLeftCountry?.shortName ?? editingLeftCountry?.name ?? ""}</span>
              </div>
              <span className="text-white/[0.72] text-[12px] font-bold tracking-[0.12em] uppercase">vs</span>
              <div className="inline-flex items-center gap-2 min-w-0 text-[16px] font-bold">
                <CountryFlag code={editingRightCountry?.code} />
                <span>{editingRightCountry?.shortName ?? editingRightCountry?.name ?? ""}</span>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center [&_input]:w-full [&_input]:min-w-0 [&_input]:py-2 [&_input]:px-2.5 [&_input]:border [&_input]:border-white/15 [&_input]:rounded-[10px] [&_input]:bg-white/[0.04] [&_input]:text-inherit [&_input]:text-center [&_input]:text-[16px] [&_input]:font-bold">
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
