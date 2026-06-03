'use client'
import React from "react";
import { Match, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import { MatchInput } from "@/components/common/MatchInput";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { useInterval } from "@/hooks/useInterval";
import commonStyles from "@/styles/CommonStyles.module.scss";
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
  LeniCard,
} from "@/components/view/Groups";
import { Warning } from "@/components/common/Warning";
import Link from "next/link";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import { getNextMatches, getTodayMatches } from "@/utils/date";
import {
  DailyMatches,
  DailyMatchInput,
} from "@/components/common/DailyMatches";
import { ShareToday } from "@/components/common/ShareButton/ShareToday";
import { useQuery } from "@tanstack/react-query";

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
  matches?: UIMatch[];
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark">;
  userProdeId: string;
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

export default function GroupsPage() {
  const session = useRequireSession();
  const i18n = useLocalizedText();

  const { data: props } = useQuery<GroupsData>({ queryKey: ["groups-page-data"], queryFn: () => fetch("/api/groups-page-data").then((r) => r.json()), enabled: session.status === "authenticated" });

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const submissionsEnded = React.useMemo(() => {
    if (!props) return false;
    return new Date(props.submissionEndsAt).getTime() <= now;
  }, [now, props]);

  const [updating, setUpdating] = React.useState(false);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);

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

  const isModified = !!differentMatches.length;

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
    <Layout backgroundImage={`/${props?.userRanking?.background}.png`}>
      <DesktopHeader userRanking={props?.userRanking}>
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
        <Button disabled={!props?.finalsStarted} invert href={`/finals`}>
          {i18n.buttonLabelFinalsPhase}
        </Button>
      </DesktopHeader>
      <MobileHeader
        list
        finalsStarted={props?.finalsStarted}
        userRanking={props?.userRanking}
        shareUserProdeId={props?.userProdeId}
      />
      <Warning offset>
        {i18n.groupsWarning}{" "}
        <Link href="/rooms">{i18n.groupsWarningLink}</Link>
        .
      </Warning>

      <Container full>
        <GroupsContainer full>
          <ContainerHeader
            sticky
            title={i18n.groupsTitle}
            gridArea="matches-header"
          >
            <Button
              disabled={!isModified || submissionsEnded}
              className={commonStyles.marginLeftAuto}
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
              <Card key={group} title={group.replace("GROUP_", "GRUPO ")}>
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match) => (
                      <MatchInput
                        key={match.id}
                        disabled={match.disabled || submissionsEnded}
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
            <LeniCard />
          </CardsContainer>

          <Card
            title={
              <>
                {todayMatches
                  ? i18n.todayMatchesLabel
                  : i18n.upcomingMatchesLabel}
                <ShareToday userProdeId={props?.userProdeId} />
              </>
            }
            gridArea="following"
          >
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchInput
                      key={match.id}
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props?.submissionEndsAt ?? ""}
                      date={new Date(match.date)}
                      countryLeftId={match.countryLeftId}
                      today={!!todayMatches}
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
        </GroupsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
