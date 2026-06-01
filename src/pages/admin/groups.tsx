import React from "react";
import { Match } from "@/generated/prisma";
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
  AdminMatchInput,
  MatchInput,
} from "../../components/common/MatchInput";
import {
  Layout,
  Footer,
  Header,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import { prisma } from "../../lib";
import commonStyles from "../../styles/CommonStyles.module.scss";
import axios from "axios";
import { useRouter } from "next/router";
import { CardsContainer, GroupsContainer } from "../../components/view/Groups";
import { getUserByEmail } from "../../utils/queries";
import { redirectToLogin, redirectToRoot } from "../../utils/redirect";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";

type UIMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled"
> & {
  countryLeftId: string;
  countryRightId: string;
};

interface HomeProps {
  matches: UIMatch[];
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  const [updating, setUpdating] = React.useState(false);
  const [matches, setMatches] = React.useState<UIMatch[]>(props.matches);
  const [originalMatches, setOriginalMatches] = React.useState<UIMatch[]>(
    props.matches || []
  );

  const handleGoalsChange = React.useCallback(
    (id: string, goalsLeft: number | null, goalsRight: number | null) => {
      setMatches((matches) =>
        matches.map((match) =>
          match.id === id ? { ...match, goalsLeft, goalsRight } : match
        )
      );
    },
    []
  );

  const handleSave = React.useCallback(() => {
    setUpdating(true);
    axios
      .post("/api/admin/groups", {
        matches: matches
          .map((match) => ({
            id: match.id,
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
          }))
          .filter(
            (match) =>
              (match.goalsLeft || match.goalsLeft === 0) &&
              (match.goalsRight || match.goalsRight === 0)
          ),
      })
      .then((response) => {
        setOriginalMatches(matches);
        setUpdating(false);
      });
  }, [matches]);

  const isModified = React.useMemo(() => {
    return matches.some((match) => {
      const originalMatch = originalMatches.find((m) => m.id === match.id);
      if (!originalMatch) return false;
      if (
        originalMatch.goalsLeft !== match.goalsLeft ||
        originalMatch.goalsRight !== match.goalsRight
      )
        return true;
    });
  }, [originalMatches, matches]);

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
        <LeniBall />
        <HeaderMenu />
      </Header>
      <Container>
        <GroupsContainer full admin>
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
              {i18n.buttonLabelSave}
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
                      <AdminMatchInput
                        key={match.id}
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        onChange={(leftGoals, rightGoals) =>
                          handleGoalsChange(match.id, leftGoals, rightGoals)
                        }
                      />
                    ))}
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
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
        in: [
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
      countryLeft: true,
      countryRight: true,
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

          goalsLeft: match.filled ? match.goalsLeft : null,
          countryLeftId: match.countryLeftId,

          goalsRight: match.filled ? match.goalsRight : null,
          countryRightId: match.countryRightId,
        })),
    },
  };
}
