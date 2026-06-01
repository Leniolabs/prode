import React from "react";
import { Match, User } from "@/generated/prisma";
import { GetServerSidePropsContext } from "next";
import { getPageSession } from "@/lib/auth/getPageSession";
import { BrandLogo } from "../components/common/BrandLogo";
import { Button } from "../components/common/Button";
import { DesktopHeader, MobileHeader } from "../components/common/Header";
import { MatchInput } from "../components/common/MatchInput";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "../hooks";
import commonStyles from "../styles/CommonStyles.module.scss";
import axios from "axios";
import {
  CardsContainer,
  GroupsContainer,
  LeniCard,
} from "../components/view/Groups";
import { redirectToLogin } from "../utils/redirect";
import {
  createTemplateUserProde,
  finalsStarted,
  getUserByEmail,
  getUserTemplateGroupMatches,
  getUserTemplateProde,
} from "../utils/queries";
import { Warning } from "../components/common/Warning";
import Link from "next/link";
import { LocaleSelect } from "../components/common/LocaleSelect";
import { useLocalizedText } from "../locale";
import { getNextMatches, getTodayMatches } from "../utils/date";
import {
  DailyMatches,
  DailyMatchInput,
} from "../components/common/DailyMatches";
import { ShareToday } from "../components/common/ShareButton/ShareToday";

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

interface HomeProps {
  submissionsEnded: boolean;
  groupsStarted: boolean;
  finalsStarted: boolean;
  matches?: UIMatch[];
  userRanking: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  >;
  userProdeId: string;
  todayMatches?: UIMatch[];
  nextMatches?: UIMatch[];
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();

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
      .then((response) => {
        setOriginalMatches(matches);
        setTimeout(() => {
          setUpdating(false);
        }, 500);
      });
  }, [differentMatches]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <DesktopHeader userRanking={props.userRanking}>
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
        <Button disabled={!props.finalsStarted} invert href={`/finals`}>
          {i18n.buttonLabelFinalsPhase}
        </Button>
      </DesktopHeader>
      <MobileHeader
        list
        finalsStarted={props.finalsStarted}
        userRanking={props.userRanking}
        shareUserProdeId={props.userProdeId}
      />
      <Warning offset>
        {i18n.groupsWarning}{" "}
        <Link href="/rooms" legacyBehavior>
          <a>{i18n.groupsWarningLink}</a>
        </Link>
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
              <Card key={group} title={group.replace("GROUP_", "GRUPO ")}>
                <CardContent>
                  {matches
                    .filter((match) => match.stage === group)
                    .map((match) => (
                      <MatchInput
                        key={match.id}
                        disabled={match.disabled || props.submissionsEnded}
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
                      disabled={match.disabled || props.submissionsEnded}
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getPageSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  let userProdeId = (await getUserTemplateProde(user))?.id;
  if (!userProdeId) {
    userProdeId = (await createTemplateUserProde(user))?.id;
  }

  const matches = await getUserTemplateGroupMatches(user);

  const nextMatches = getNextMatches(matches);
  const todayMatches = getTodayMatches(matches);

  return {
    props: {
      userProdeId,
      submissionsEnded: false,
      finalsStarted: await finalsStarted(),
      userRanking: {
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        dark: user.dark,
        background: user.background,
      },
      matches,
      todayMatches: todayMatches.length ? todayMatches : null,
      nextMatches: nextMatches.length ? nextMatches : null,
    },
  };
}
