import React from "react";
import { Match, ProdeRoom, User } from "@/generated/prisma";
import { GetServerSidePropsContext } from "next";
import { getPageSession } from "@/lib/auth/getPageSession";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import { DesktopHeader, MobileHeader } from "../../components/common/Header";
import { MatchInput } from "../../components/common/MatchInput";
import { Table } from "../../components/common/Table";
import { UserPositionDisplay } from "../../components/common/UserPositionDisplay";
import { UserRankingDisplay } from "../../components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardFooter,
  CardContent,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import commonStyles from "../../styles/CommonStyles.module.scss";
import { filterUniquePredicate } from "../../utils/array";
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
  GroupsResultsWarning,
  LeniCard,
} from "../../components/view/Groups";
import {
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
  getUserGroupMatches,
  getUserProde,
  getUserRanking,
  registerUserToRoom,
} from "../../utils/queries";
import { Meta } from "../../components/common/Meta";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";
import {
  DailyMatches,
  DailyMatchInput,
} from "../../components/common/DailyMatches";
import { getNextMatches, getTodayMatches } from "../../utils/date";
import { useRouter } from "next/router";
import { ShareToday } from "../../components/common/ShareButton/ShareToday";
import { GapIcon } from "../../components/common/Icons";
import { Warning } from "../../components/common/Warning";

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
  finalsStarted: boolean;
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

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const router = useRouter();

  const i18n = useLocalizedText();

  const { todayMatches: _todayMatches, nextMatches: _nextMatches } = props;

  const [updating, setUpdating] = React.useState(false);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(
    props.matches || []
  );
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches || []);

  const todayMatches = React.useMemo(() => {
    return _todayMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match
    );
  }, [_todayMatches, matches]);
  const nextMatches = React.useMemo(() => {
    return _nextMatches?.map(
      (match) => matches.find((m) => m.id === match.id) || match
    );
  }, [_nextMatches, matches]);

  const handleGoalsChange = React.useCallback(
    (
      id: string,
      userGoalsLeft: number | null,
      userGoalsRight: number | null
    ) => {
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
      if (
        originalMatch.userGoalsLeft !== match.userGoalsLeft ||
        originalMatch.userGoalsRight !== match.userGoalsRight
      )
        return true;
      return false;
    });
  }, [originalMatches, matches]);

  const isModified = React.useMemo(() => {
    return !!differentMatches.length;
  }, [originalMatches, matches]);

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post(`/api/${props.id}/groups`, {
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
      .then((response) => {
        setOriginalMatches(matches);
        setTimeout(() => {
          setUpdating(false);
        }, 500);
      });
  }, [props.id, differentMatches]);

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
        <Button
          disabled={!props.finalsStarted}
          invert
          href={`/${props.id}/finals`}
        >
          {i18n.buttonLabelFinalsPhase}
        </Button>
      </DesktopHeader>
      <MobileHeader
        list
        id={props.id}
        name={props.name}
        room={props.room}
        finalsStarted={props.finalsStarted}
        userRanking={props.userRanking}
        roomAdmin={props.roomAdmin}
        groups={true}
        finals={true}
        shareUserProdeId={props.userProdeId}
      />
      {props.room && (
        <GroupsResultsWarning
          roomConfig={{
            pointsGoals: props.room.pointsGoals,
            pointsWinner: props.room.pointsWinner,
            pointsPenal: props.room.pointsPenal,
          }}
        />
      )}
      <Container full>
        <GroupsContainer>
          <ContainerHeader
            sticky
            title={i18n.groupsTitle}
            gridArea="matches-header"
          >
            <Button
              disabled={!isModified}
              className={commonStyles.marginLeftAuto}
              onClick={handleSave}
            >
              {updating ? i18n.buttonLabelSaving : i18n.buttonLabelSave}
            </Button>
          </ContainerHeader>
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
              "GROUP_L",            ].map((group) => (
              //@ts-ignore
              <Card key={group} title={i18n[group]}>
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match) => (
                      <MatchInput
                        key={match.id}
                        disabled={match.disabled}
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
                <ShareToday userProdeId={props.userProdeId} />
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
                      disabled={match.disabled}
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
          <Card title={i18n.rankingTitle} gridArea="ranking">
            <CardContent>
              <Table
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
                onRowClick={handleUserClick}
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
        </GroupsContainer>
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

  const session = await getPageSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  const room = await getProdeRoom(id);
  if (!room) return redirectToRooms(context.locale);

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

  const matches = await getUserGroupMatches(room, user);

  const ranking = await getRanking(room, 0, 10);
  const userRanking = await getUserRanking(room, userProde);

  const nextMatches = getNextMatches(matches);
  const todayMatches = getTodayMatches(matches);

  return {
    props: {
      id,
      userProdeId,
      roomAdmin: room.userId === user.id,
      name: room.name,
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
      finalsStarted: room.prode.stage === "FINALS",
      userRanking: {
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        ranking: userRanking?.ranking,
        points: userRanking?.points,
        dark: user.dark,
        background: user.background,
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
