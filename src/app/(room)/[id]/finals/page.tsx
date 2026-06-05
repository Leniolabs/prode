'use client'
import React from "react";
import { Match, ProdeRoom, Stage, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import { Table } from "@/components/common/Table";
import { UserPositionDisplay } from "@/components/common/UserPositionDisplay";
import { UserRankingDisplay } from "@/components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardFooter,
  CardContent,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { useInterval } from "@/hooks/useInterval";
import { filterUniquePredicate } from "@/utils/array";
import axios from "axios";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import {
  BracketIcon,
  bracketOffsetQuarter,
  BracketsContainer,
  BracketsMobileContainer,
  BracketTitle,
  FinalsContainer,
  FinalsResultsWarning,
} from "@/components/view/Finals";
import { className } from "@/utils/classname";
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
import { useQuery } from "@tanstack/react-query";
import { getMatchOrder } from "@/utils/finals";

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
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"> & {
    points: number; ranking: number;
  };
  ranking: (Ranking & { gap: boolean })[];
  matches: UIMatch[];
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}


export default function RoomFinalsPage() {
  const session = useRequireSession();
  const i18n = useLocalizedText();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const timezone = React.useMemo(() => new Date().getTimezoneOffset().toString(), []);

  const { data: props } = useQuery<RoomFinalsData>({ queryKey: ["room-finals-data", id, timezone], queryFn: () => fetch(`/api/room-finals-data?id=${id}&timezone=${timezone}`).then((r) => r.json()), enabled: session.status === "authenticated" && !!id });

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const submissionsEnded = React.useMemo(() => {
    if (!props) return false;
    return new Date(props.submissionEndsAt).getTime() <= now;
  }, [now, props]);

  const [updating, setUpdating] = React.useState(false);
  const [matches, setMatches] = React.useState<UIMatch[]>([]);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>([]);

  React.useEffect(() => {
    if (props?.matches) {
      setMatches(props.matches);
      setOriginalMatches(props.matches);
    }
  }, [props?.matches]);

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

  const isModified = !!differentMatches.length;

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
        setTimeout(() => setUpdating(false), 500);
      });
  }, [id, differentMatches, matches]);

  const handleUserClick = React.useCallback(
    (row: Ranking) => {
      if (row && row.id) router.push(`/${row.id}/view`);
    },
    [router]
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout>
      <Meta />
      <DesktopHeader
        id={props?.id}
        name={props?.name}
        room={props?.room}
        userRanking={props?.userRanking}
        roomAdmin={props?.roomAdmin}
      >
        <Button invert href={`/rooms`}>{i18n.buttonLabelProdeList}</Button>
        <Button invert href={`/${id}/groups`}>{i18n.buttonLabelGroupPhase}</Button>
      </DesktopHeader>
      <MobileHeader
        list
        id={id}
        name={props?.name}
        room={props?.room}
        finalsStarted={true}
        userRanking={props?.userRanking}
        roomAdmin={props?.roomAdmin}
        groups={true}
        finals={true}
        shareUserProdeId={props?.userProdeId}
      />
      {props?.room && <FinalsResultsWarning roomConfig={props.room} />}
      <Container full>
        <FinalsContainer>
          <ContainerHeader gridArea="matches-header" sticky title={i18n.finalsTitle}>
            <Button disabled={!isModified || submissionsEnded} onClick={handleSave}>
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
          <BracketsContainer gridArea="matches">
            <BracketTitle full order={0}>{i18n.FINALS_16}</BracketTitle>
            {matches.filter((x) => x.stage.includes("FINALS_16_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match) => (
              <UserMatchFinalsInput disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage)} filled={match.filled} />
            ))}
            <BracketIcon order={17} /><BracketIcon order={17} /><BracketIcon order={17} /><BracketIcon order={17} />
            <BracketIcon order={17} /><BracketIcon order={17} /><BracketIcon order={17} /><BracketIcon order={17} />
            <BracketTitle full order={17}>{i18n.FINALS_8}</BracketTitle>
            {matches.filter((x) => x.stage.includes("FINALS_8_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match) => (
              <UserMatchFinalsInput disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage)} filled={match.filled} />
            ))}
            <BracketIcon order={26} /><BracketIcon order={26} /><BracketIcon order={26} /><BracketIcon order={26} />
            <BracketTitle order={26} full>{i18n.FINALS_4}</BracketTitle>
            {matches.filter((x) => x.stage.includes("FINALS_4_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match) => (
              <UserMatchFinalsInput showCountryStatus disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage)} filled={match.filled} />
            ))}
            <BracketIcon order={31} big /><BracketIcon order={31} big />
            <BracketTitle className={bracketOffsetQuarter} order={31} full>{i18n.FINALS_2}</BracketTitle>
            {matches.filter((x) => x.stage.includes("FINALS_2_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match, index) => (
              <UserMatchFinalsInput showCountryStatus key={match.id} disabled={match.disabled || submissionsEnded}
                submissionEndsAt={props?.submissionEndsAt ?? ""} className={className(index === 0 && bracketOffsetQuarter)}
                date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage)} filled={match.filled} />
            ))}
            <BracketIcon className={className(bracketOffsetQuarter)} order={34} big />
            <BracketTitle className={className(bracketOffsetQuarter)} order={34}>{i18n.FINAL}</BracketTitle>
            <BracketTitle order={34}>{i18n.THIRD_PLACE}</BracketTitle>
            {matches.filter((x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE").sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match, index) => (
              <UserMatchFinalsInput showCountryStatus className={className(index === 0 && bracketOffsetQuarter)}
                disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={getMatchOrder(match.stage)} filled={match.filled} />
            ))}
          </BracketsContainer>
          <BracketsMobileContainer gridArea="matches">
            <CollapsableContainer>
              <Collapsable title={i18n.FINALS_16}>
                {matches.filter((x) => x.stage.includes("FINALS_16_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                    key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                    userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_8}>
                {matches.filter((x) => x.stage.includes("FINALS_8_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                    key={match.id} date={new Date(match.date)} userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                    userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1 + 16} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_4}>
                {matches.filter((x) => x.stage.includes("FINALS_4_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput showCountryStatus disabled={match.disabled || submissionsEnded} submissionEndsAt={props?.submissionEndsAt ?? ""}
                    key={match.id} date={new Date(match.date)} userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                    userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight} userPenaltisLeft={match.userPenaltisLeft}
                    userPenaltisRight={match.userPenaltisRight} penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                    goalsLeft={match.goalsLeft} goalsRight={match.goalsRight} countryLeftId={match.countryLeftId}
                    countryRightId={match.countryRightId} onChange={handleMatchChange(match.id)} order={index + 1 + 16 + 8} filled={match.filled} />
                ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_2}>
                {matches.filter((x) => x.stage.includes("FINALS_2_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                  <UserMatchFinalsInput showCountryStatus key={match.id} disabled={match.disabled || submissionsEnded}
                    submissionEndsAt={props?.submissionEndsAt ?? ""} date={new Date(match.date)}
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
                  <UserMatchFinalsInput showCountryStatus disabled={match.disabled || submissionsEnded}
                    submissionEndsAt={props?.submissionEndsAt ?? ""} key={match.id} date={new Date(match.date)}
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
          <Card title={<>{todayMatches ? i18n.todayMatchesLabel : i18n.upcomingMatchesLabel}<ShareToday userProdeId={props?.userProdeId} /></>} gridArea="following">
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchFinalInput disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props?.submissionEndsAt ?? ""} key={match.id} today={!!todayMatches}
                      date={new Date(match.date)} userCountryLeftId={match.countryLeftId}
                      userGoalsLeft={match.userGoalsLeft} userCountryRightId={match.countryRightId}
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
          <Card title={i18n.rankingTitle} gridArea="ranking">
            <CardContent>
              <Table
                onRowClick={handleUserClick}
                columns={[
                  { header: i18n.rankingPositionColumn, accesor: (row) => !row.gap && <UserPositionDisplay position={row.ranking} />, width: "50px" },
                  { header: i18n.rankingNameColumn, accesor: (row) => row.gap ? <GapIcon /> : <UserRankingDisplay name={row.name || ""} image={row.image} /> },
                  { header: i18n.rankingTotalColumn, accesor: (row) => (!row.gap ? row.points : ""), align: "RIGHT", width: "50px" },
                ]}
                data={props?.ranking || []}
                clickable={(row: Ranking & { gap: boolean }) => !row.gap}
              />
            </CardContent>
            <CardFooter>
              <Button href={`/${id}/ranking`} variant="secondary">{i18n.buttonCompleteRanking}</Button>
            </CardFooter>
          </Card>
        </FinalsContainer>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
