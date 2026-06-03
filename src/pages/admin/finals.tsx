import React from "react";
import { Match, Stage } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import {
  HeaderMessage,
  LeniBall,
  HeaderMenu,
} from "../../components/common/Header";
import {
  Layout,
  Footer,
  Header,
  Container,
  ContainerHeader,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import { prisma } from "../../lib";
import axios from "axios";
import commonStyles from "../../styles/CommonStyles.module.scss";
import {
  getAdminFinalsMatchLooser,
  getAdminFinalsMatchWinner,
} from "../../utils/points";
import { MatchFinalsInput } from "../../components/common/MatchFinalsInput";
import { useRouter } from "next/router";
import {
  BracketIcon,
  BracketsContainer,
  BracketTitle,
  FinalsContainer,
  bracketOffsetQuarter,
} from "../../components/view/Finals";
import { redirectToLogin, redirectToRoot } from "../../utils/redirect";
import { getUserByEmail } from "../../utils/queries";
import { className } from "../../utils/classname";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";
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
  countryRightId?: string;
};

interface HomeProps {
  matches: UIMatch[];
}

const getMatchOrder = (matchStage: Stage) => {
  return getFinalsStageOrder(matchStage);
};

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  const [updating, setUpdating] = React.useState(false);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(
    props.matches || []
  );
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches);

  const computedMatches = React.useMemo(() => {
    return resolveFinalsMatches(
      matches,
      getAdminFinalsMatchWinner,
      getAdminFinalsMatchLooser
    );
  }, [matches]);

  const handleMatchChange = React.useCallback(
    (id: string) =>
      (value: {
        countryLeftId: string | undefined;
        goalsLeft: number | null;
        countryRightId: string | undefined;
        goalsRight: number | null;
        penaltisLeft?: number | null;
        penaltisRight?: number | null;
      }) => {
        setMatches(
          computedMatches.map((match) =>
            match.id === id
              ? {
                  ...match,
                  countryLeftId: value.countryLeftId,
                  goalsLeft: value.goalsLeft,
                  countryRightId: value.countryRightId,
                  goalsRight: value.goalsRight,
                  penaltisLeft: value.penaltisLeft ?? null,
                  penaltisRight: value.penaltisRight ?? null,
                }
              : match
          )
        );
      },
    [computedMatches]
  );

  const differentMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      if (
        originalMatch.countryLeftId !== match.countryLeftId ||
        originalMatch.countryRightId !== match.countryRightId ||
        originalMatch.goalsLeft !== match.goalsLeft ||
        originalMatch.goalsRight !== match.goalsRight ||
        originalMatch.penaltisLeft !== match.penaltisLeft ||
        originalMatch.penaltisRight !== match.penaltisRight
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
      .post("/api/admin/finals", {
        matches: differentMatches
          .map((match) => ({
            id: match.id,
            countryLeftId: match.countryLeftId,
            countryRightId: match.countryRightId,
            goalsLeft: match.goalsLeft ?? null,
            goalsRight: match.goalsRight ?? null,
            penaltisLeft: match.penaltisLeft ?? null,
            penaltisRight: match.penaltisRight ?? null,
          }))
          .filter((match) => match.countryLeftId && match.countryRightId),
      })
      .then((response) => {
        setOriginalMatches(matches);
        setUpdating(false);
      });
  }, [differentMatches]);

  const handleStartFinals = React.useCallback(() => {
    axios.post("/api/admin/finals-start").then(() => {});
  }, []);

  return (
    <Layout>
      <Header>
        <HeaderMessage
          title={i18n.headerTitle}
          subtitle={
            <>
              {i18n.headerWelcomeLine}
              <br />
              {i18n.headerWelcomeLine1}
              <br />
              <span>{i18n.headerWelcomeLine2}</span>.
            </>
          }
        />
        <Button onClick={handleStartFinals}>Start Finals</Button>
        <LeniBall />
        <HeaderMenu />
      </Header>
      <Container full>
        <FinalsContainer full admin>
          <ContainerHeader
            sticky
            title={i18n.finalsTitle}
            gridArea="matches-header"
          >
            <Button
              disabled={!isModified}
              className={commonStyles.marginLeftAuto}
              onClick={handleSave}
            >
              {i18n.buttonLabelSave}
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
                <MatchFinalsInput
                  key={match.id}
                  date={new Date(match.date)}
                  countryLeftId={match.countryLeftId}
                  goalsLeft={match.goalsLeft ?? undefined}
                  countryRightId={match.countryRightId}
                  goalsRight={match.goalsRight ?? undefined}
                  penaltisLeft={match.penaltisLeft ?? null}
                  penaltisRight={match.penaltisRight ?? null}
                  onChange={handleMatchChange(match.id)}
                  countryInput
                  order={getMatchOrder(match.stage)}
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
                <MatchFinalsInput
                  key={match.id}
                  date={new Date(match.date)}
                  countryLeftId={match.countryLeftId}
                  goalsLeft={match.goalsLeft ?? undefined}
                  countryRightId={match.countryRightId}
                  goalsRight={match.goalsRight ?? undefined}
                  penaltisLeft={match.penaltisLeft ?? null}
                  penaltisRight={match.penaltisRight ?? null}
                  onChange={handleMatchChange(match.id)}
                  countryInput
                  order={getMatchOrder(match.stage)}
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
                <MatchFinalsInput
                  key={match.id}
                  className={className(index === 0 && bracketOffsetQuarter)}
                  date={new Date(match.date)}
                  countryLeftId={match.countryLeftId}
                  goalsLeft={match.goalsLeft ?? undefined}
                  countryRightId={match.countryRightId}
                  goalsRight={match.goalsRight ?? undefined}
                  penaltisLeft={match.penaltisLeft ?? null}
                  penaltisRight={match.penaltisRight ?? null}
                  onChange={handleMatchChange(match.id)}
                  countryInput
                  order={getMatchOrder(match.stage)}
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
                <MatchFinalsInput
                  className={className(index === 0 && bracketOffsetQuarter)}
                  key={match.id}
                  date={new Date(match.date)}
                  countryLeftId={match.countryLeftId}
                  goalsLeft={match.goalsLeft ?? undefined}
                  countryRightId={match.countryRightId}
                  goalsRight={match.goalsRight ?? undefined}
                  penaltisLeft={match.penaltisLeft ?? null}
                  penaltisRight={match.penaltisRight ?? null}
                  onChange={handleMatchChange(match.id)}
                  countryInput
                  order={getMatchOrder(match.stage)}
                />
              ))}
          </BracketsContainer>
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
  const session = await getSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  if (user.email !== process.env.ADMIN_EMAIL)
    return redirectToRoot(context.locale);

  const matches = await prisma.match.findMany({
    where: {
      stage: {
        notIn: [
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
          "GROUP_L",        ],
      },
    },
    include: {
      userResults: {
        where: {
          userProde: {
            userId: user.id,
          },
        },
      },
    },
  });

  return {
    props: {
      matches: matches
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((match) => ({
          id: match.id,
          date: match.date.toISOString(),
          stage: match.stage,
          filled: match.filled,

          goalsLeft: match.goalsLeft ?? null,
          countryLeftId: match.countryLeftId,
          penaltisLeft: match.penaltisLeft ?? null,

          goalsRight: match.goalsRight ?? null,
          countryRightId: match.countryRightId,
          penaltisRight: match.penaltisRight ?? null,
        })),
    },
  };
}
