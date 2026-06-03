import React from "react";
import { Match, ProdeRoom, Stage, User, UserProde } from '@/generated/prisma';
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import { DesktopHeader, MobileHeader } from "../../components/common/Header";
import { Table } from "../../components/common/Table";
import { UserPositionDisplay } from "../../components/common/UserPositionDisplay";
import { UserRankingDisplay } from "../../components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
  CardFooter,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import { useInterval } from "../../hooks/useInterval";
import { filterUniquePredicate } from "../../utils/array";
import axios from "axios";
import { getFinalsMatchLooser, getFinalsMatchWinner } from "../../utils/points";
import { UserMatchFinalsInput } from "../../components/common/UserMatchFinalsInput";
import {
  BracketsContainer,
  FinalsContainer,
  BracketIcon,
  BracketTitle,
  bracketOffsetQuarter,
  BracketsMobileContainer,
  FinalsResultsWarning,
} from "../../components/view/Finals";
import {
  redirectToGroups,
  redirectToLogin,
  redirectToPasswordCheck,
  redirectToRooms,
  roomEmailCheck,
  shouldPasswordCheck,
} from "../../utils/redirect";
import {
  getProdeRoom,
  getRanking,
  getUserByEmail,
  getUserFinalMatches,
  getUserProde,
  getUserRanking,
  registerUserToRoom,
} from "../../utils/queries";
import { className } from "../../utils/classname";
import {
  Collapsable,
  CollapsableContainer,
} from "../../components/common/Collapsable";
import { Meta } from "../../components/common/Meta";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";
import { getNextMatches, getTodayMatches } from "../../utils/date";
import {
  DailyMatches,
  DailyMatchFinalInput,
} from "../../components/common/DailyMatches";
import { useRouter } from "next/router";
import { GapIcon } from "../../components/common/Icons";
import { ShareToday } from "../../components/common/ShareButton";
import {
  getFinalsStageGroup,
  getFinalsStageOrder,
  resolveFinalsMatches,
} from "../../utils/finals";

type UIMatch = Pick<
  Match,
  | "date"
  | "goalsLeft"
  | "goalsRight"
  | "id"
  | "stage"
  | "filled"
  | "penaltisLeft"
  | "penaltisRight"
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
}

interface HomeProps {
  id: string;
  name: string;
  roomAdmin: boolean;
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
  submissionEndsAt: string;
  userRanking: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"
  > & {
    points: number;
    ranking: number;
  };
  ranking: (Ranking & { gap: boolean })[];
  matches: UIMatch[];
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

export const getMatchOrder = (matchStage: Stage, mobile?: boolean) => {
  return getFinalsStageOrder(matchStage, mobile);
};

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const i18n = useLocalizedText();
  const router = useRouter();
  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 60000);
  const submissionsEnded = React.useMemo(() => {
    return new Date(props.submissionEndsAt).getTime() <= now;
  }, [now, props.submissionEndsAt]);

  const { todayMatches: _todayMatches, nextMatches: _nextMatches } = props;

  const { id } = props;

  const [updating, setUpdating] = React.useState(false);
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(
    props.matches || []
  );

  const computedMatches = React.useMemo(() => {
    return resolveFinalsMatches(
      matches,
      getFinalsMatchWinner,
      getFinalsMatchLooser
    );
  }, [matches]);

  const todayMatches = React.useMemo(() => {
    return _todayMatches?.map(
      (match) => computedMatches.find((m) => m.id === match.id) || match
    );
  }, [_todayMatches, computedMatches]);
  const nextMatches = React.useMemo(() => {
    return _nextMatches?.map(
      (match) => computedMatches.find((m) => m.id === match.id) || match
    );
  }, [_nextMatches, computedMatches]);

  const handleMatchChange = React.useCallback(
    (id: string) => {
      return (value: {
        countryLeftId: string | undefined;
        goalsLeft: number | null;
        countryRightId: string | undefined;
        goalsRight: number | null;
        penaltisLeft: number | null;
        penaltisRight: number | null;
      }) => {
        setMatches(
          computedMatches.map((match) =>
            match.id === id
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
      };
    },
    [computedMatches]
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      if (
        originalMatch.userGoalsLeft !== match.userGoalsLeft ||
        originalMatch.userGoalsRight !== match.userGoalsRight ||
        originalMatch.userPenaltisLeft !== match.userPenaltisLeft ||
        originalMatch.userPenaltisRight !== match.userPenaltisRight
      )
        return true;
      return false;
    });
  }, [originalMatches, matches]);

  const isModified = React.useMemo(() => {
    return !!differentMatches.length;
  }, [differentMatches.length, matches]);

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
      .then((response) => {
        setOriginalMatches(matches);
        setTimeout(() => {
          setUpdating(false);
        }, 500);
      });
  }, [id, differentMatches]);

  const handleUserClick = React.useCallback(
    (row: Ranking) => {
      if (row && row.id) router.push(`/${row.id}/view`);
    },
    [props.id]
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <Meta />
      <DesktopHeader
        id={props.id}
        name={props.name}
        room={props.room}
        userRanking={props.userRanking}
        roomAdmin={props.roomAdmin}
      >
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
        <Button invert href={`/${props.id}/groups`}>
          {i18n.buttonLabelGroupPhase}
        </Button>
      </DesktopHeader>
      <MobileHeader
        list
        id={props.id}
        name={props.name}
        room={props.room}
        finalsStarted={true}
        userRanking={props.userRanking}
        roomAdmin={props.roomAdmin}
        groups={true}
        finals={true}
        shareUserProdeId={props.userProdeId}
      />
      {props.room && <FinalsResultsWarning roomConfig={props.room} />}
      <Container full>
        <FinalsContainer>
          <ContainerHeader
            gridArea="matches-header"
            sticky
            title={i18n.finalsTitle}
          >
            <Button disabled={!isModified || submissionsEnded} onClick={handleSave}>
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
          <BracketsContainer gridArea="matches">
            <BracketTitle full order={0}>
              {i18n.FINALS_8}
            </BracketTitle>
            {computedMatches
              .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_8")
              .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
              .map((match) => (
                <UserMatchFinalsInput
                  disabled={match.disabled || submissionsEnded}
                  submissionEndsAt={props.submissionEndsAt}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.countryLeftId}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.countryRightId}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId}
                  countryRightId={match.countryRightId}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketIcon order={9} />
            <BracketTitle order={9} full>
              {i18n.FINALS_4}
            </BracketTitle>
            {computedMatches
              .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_4")
              .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
              .map((match) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  disabled={match.disabled || submissionsEnded}
                  submissionEndsAt={props.submissionEndsAt}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId}
                  countryRightId={match.countryRightId}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon order={14} big />
            <BracketIcon order={14} big />
            <BracketTitle className={bracketOffsetQuarter} order={14} full>
              {i18n.FINALS_2}
            </BracketTitle>
            {computedMatches
              .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_2")
              .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
              .map((match, index) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  key={match.id}
                  disabled={match.disabled || submissionsEnded}
                  submissionEndsAt={props.submissionEndsAt}
                  className={className(index === 0 && bracketOffsetQuarter)}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId}
                  countryRightId={match.countryRightId}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
            <BracketIcon
              className={className(bracketOffsetQuarter)}
              order={17}
              big
            />
            <BracketTitle
              className={className(bracketOffsetQuarter)}
              order={17}
            >
              {i18n.FINAL}
            </BracketTitle>
            <BracketTitle order={17}>{i18n.THIRD_PLACE}</BracketTitle>

            {computedMatches
              .filter((x) => getFinalsStageGroup(x.stage) === "FINAL")
              .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
              .map((match, index) => (
                <UserMatchFinalsInput
                  showCountryStatus
                  className={className(index === 0 && bracketOffsetQuarter)}
                  disabled={match.disabled || submissionsEnded}
                  submissionEndsAt={props.submissionEndsAt}
                  key={match.id}
                  date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId}
                  userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId}
                  userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft}
                  userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft}
                  penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft}
                  goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId}
                  countryRightId={match.countryRightId}
                  onChange={handleMatchChange(match.id)}
                  order={getMatchOrder(match.stage)}
                  filled={match.filled}
                />
              ))}
          </BracketsContainer>
          <BracketsMobileContainer gridArea="matches">
            <CollapsableContainer>
              <Collapsable title={i18n.FINALS_8}>
                {computedMatches
                  .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_8")
                  .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props.submissionEndsAt}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.countryLeftId}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.countryRightId}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId}
                      countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_4}>
                {computedMatches
                  .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_4")
                  .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props.submissionEndsAt}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId}
                      countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINALS_2}>
                {computedMatches
                  .filter((x) => getFinalsStageGroup(x.stage) === "FINALS_2")
                  .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      key={match.id}
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props.submissionEndsAt}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId}
                      countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8 + 4}
                      filled={match.filled}
                    />
                  ))}
              </Collapsable>
              <Collapsable title={i18n.FINAL}>
                {computedMatches
                  .filter((x) => getFinalsStageGroup(x.stage) === "FINAL")
                  .sort((a, b) => getFinalsStageOrder(a.stage) - getFinalsStageOrder(b.stage))
                  .map((match, index) => (
                    <UserMatchFinalsInput
                      showCountryStatus
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props.submissionEndsAt}
                      key={match.id}
                      date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId}
                      countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)}
                      order={index + 1 + 8 + 4 + 2}
                      filled={match.filled}
                      highlight={match.stage === "FINALS"}
                    />
                  ))}
              </Collapsable>
            </CollapsableContainer>
          </BracketsMobileContainer>
          <Card
            title={
              <>
                {todayMatches
                  ? i18n.todayMatchesLabel
                  : i18n.upcomingMatchesLabel}
                <ShareToday userProdeId={props.userProdeId} />
              </>
            }
            gridArea="following"
          >
            <CardContent>
              {(todayMatches || nextMatches)?.length ? (
                <DailyMatches>
                  {(todayMatches || nextMatches)?.map((match) => (
                    <DailyMatchFinalInput
                      disabled={match.disabled || submissionsEnded}
                      submissionEndsAt={props.submissionEndsAt}
                      key={match.id}
                      today={!!todayMatches}
                      date={new Date(match.date)}
                      userCountryLeftId={match.countryLeftId}
                      userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.countryRightId}
                      userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft}
                      userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft}
                      penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft}
                      goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId}
                      countryRightId={match.countryRightId}
                      onChange={handleMatchChange(match.id)}
                      order={getMatchOrder(match.stage) + 100}
                      filled={match.filled}
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
          <Card title={i18n.rankingTitle} gridArea="ranking">
            <CardContent>
              <Table
                onRowClick={handleUserClick}
                columns={[
                  {
                    header: i18n.rankingPositionColumn,
                    accesor: (row) =>
                      !row.gap && (
                        <UserPositionDisplay position={row.ranking} />
                      ),
                    width: "50px",
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
                    header: i18n.rankingTotalColumn,
                    accesor: (row) => (!row.gap ? row.points : ""),
                    align: "RIGHT",
                    width: "50px",
                  },
                ]}
                data={props.ranking || []}
                clickable={(row) => !row.gap}
              />
            </CardContent>
            <CardFooter>
              <Button href={`/${props.id}/ranking`} variant="secondary">
                {i18n.buttonCompleteRanking}
              </Button>
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = context.params?.id as string;

  const session = await getSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  const room = await getProdeRoom(id);
  if (!room) return redirectToRooms(context.locale);

  if (room.prode.stage !== "FINALS") {
    return redirectToGroups(context.locale, room);
  }

  let userProdeId = (await getUserProde(room, user))?.id;
  if (!userProdeId) {
    if (shouldPasswordCheck(room))
      return redirectToPasswordCheck(room, context.locale);
    else if (!roomEmailCheck(room, user))
      return redirectToRooms(context.locale);
    userProdeId = (await registerUserToRoom(room, user))?.id;
  }

  const userProde = await getUserProde(room, user);
  if (!userProde) return redirectToRooms(context.locale);

  const matches = await getUserFinalMatches(room, user);

  const ranking = await getRanking(room, 0, 10);
  const userRanking = await getUserRanking(room, userProde);

  const nextMatches = getNextMatches(matches);
  const todayMatches = getTodayMatches(matches);

  return {
    props: {
      userProdeId,
      id,
      name: room.name,
      roomAdmin: room.userId === user.id,
      room: {
        id: room.id,
        name: room.name,
        pointsWinner: room.pointsWinner,
        pointsGoals: room.pointsGoals,
        pointsPenal: room.pointsPenal,
        ...(room.userId === user.id
          ? {
              password: room.password,
              public: room.public,
              emailDomain: room.emailDomain,
            }
          : {}),
      },
      submissionEndsAt: room.prode.finalsSubmissionsEnd.toISOString(),
      finalsStarted: room.prode.stage === "FINALS",
      userRanking: {
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        dark: user.dark,
        background: user.background,
        ranking: userRanking?.ranking,
        points: userRanking?.points,
      },
      ranking: [
        ...ranking,
        ...(userRanking ? [{ id: "", gap: true }, userRanking] : []),
      ]
        .filter(filterUniquePredicate((a, b) => a.id === b.id))
        .filter((x, i, arr) => !(!x.id && i === arr.length - 1)),
      matches,
      todayMatches: todayMatches.length ? todayMatches : null,
      nextMatches: nextMatches.length ? nextMatches : null,
    },
  };
}
