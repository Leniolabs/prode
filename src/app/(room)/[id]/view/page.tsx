'use client'
import React from "react";
import { Match, ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { RoomWelcomeBar } from "@/components/common/Header";
import { MatchInput } from "@/components/common/MatchInput";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import {
  CardsContainer,
  GroupsContainer,
} from "@/components/view/Groups";
import {
  BracketIcon,
  bracketOffsetQuarter,
  BracketsContainer,
  BracketsMobileContainer,
  BracketTitle,
  FinalsContainer,
} from "@/components/view/Finals";
import { UserMatchFinalsInput } from "@/components/common/UserMatchFinalsInput";
import { className } from "@/utils/classname";
import {
  Collapsable,
  CollapsableContainer,
} from "@/components/common/Collapsable";
import { UserImage } from "@/components/common/UserImage";
import { Meta } from "@/components/common/Meta";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import { getMatchOrder } from "@/utils/finals";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useBodyRedirect } from "@/hooks";
import styles from "./page.module.scss";

type UIMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled"
> & {
  countryLeftId: string;
  userGoalsLeft?: number | null;
  countryRightId: string;
  userGoalsRight?: number | null;
  resultStatus: "GOALS_MATCH" | "WINNER_MATCH" | "WRONG";
};

type UIFinalMatch = Pick<
  Match,
  "date" | "goalsLeft" | "goalsRight" | "id" | "stage" | "filled" | "penaltisLeft" | "penaltisRight"
> & {
  countryLeftId?: string;
  userCountryLeftId?: string;
  userGoalsLeft?: number | null;
  userPenaltisLeft?: number | null;
  countryRightId?: string;
  userCountryRightId?: string;
  userGoalsRight?: number | null;
  userPenaltisRight?: number | null;
  resultStatus: "GOALS_MATCH" | "WINNER_MATCH" | "WRONG";
  countryStatus: "MATCH" | "WRONG";
};

interface ViewData {
  id: string;
  name?: string;
  userProdeId: string;
  roomAdmin: boolean;
  userInRoom: boolean;
  room?: Pick<ProdeRoom, "id" | "name" | "emailDomain" | "password" | "pointsGoals" | "pointsPenal" | "pointsWinner" | "public">;
  finalsStarted: boolean;
  userRanking?: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"> & {
    points?: number; ranking?: number;
  };
  viewUser: Pick<User, "id" | "name" | "image">;
  matches?: UIMatch[];
  finalsMatches?: UIFinalMatch[];
}

type ViewResponse = ViewData & { redirect?: string };

export default function ViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const i18n = useLocalizedText();

  const { data: props } = useQuery<ViewResponse>({ queryKey: ["view-page-data", id], queryFn: () => fetch(`/api/view-page-data?id=${id}`).then((r) => r.json()), enabled: !!id });
  const redirected = useBodyRedirect(props?.redirect);

  const { matches, finalsMatches } = props ?? {};

  if (redirected) return null;

  return (
    <Layout>
      <Meta />
      {props?.userRanking && (
        <RoomWelcomeBar
          id={props.id}
          name={props.name}
          room={props.room}
          userRanking={props.userRanking}
          roomAdmin={props.roomAdmin}
        />
      )}
      <Container full>
        <GroupsContainer full admin className={styles.viewAdminContainer}>
          <ContainerHeader
            gridArea="matches-header"
            className={`${styles.groupsStageHeader} ${styles.viewTitleHeader}`}
            noMarginTop={!props?.userRanking}
            title={
              <>
                <UserImage
                  small
                  image={props?.viewUser?.image}
                  className={styles.viewTitleAvatar}
                />
                {i18n.viewTitle}
                {props?.viewUser?.name}
                {i18n.viewTitleAfter}
              </>
            }
          />
        </GroupsContainer>
        <GroupsContainer full admin className={styles.viewAdminContainer}>
          <ContainerHeader
            gridArea="matches-header"
            sticky
            noMarginTop
            noMarginBottom
            className={`${styles.groupsStageHeader} ${styles.viewPageHeader}`}
            title={i18n.groupsTitle}
          />
          <CardsContainer gridArea="matches">
            {[
              "GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E", "GROUP_F",
              "GROUP_G", "GROUP_H", "GROUP_I", "GROUP_J", "GROUP_K", "GROUP_L",
            ].map((group) => (
              <Card
                key={group}
                className={styles.groupCard}
                title={i18n[group as keyof typeof i18n]}
              >
                <CardContent>
                  {(matches || [])
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={
                          styles[
                            `matchPair${Math.floor(index / 2)}` as keyof typeof styles
                          ]
                        }
                        disabled={true}
                        date={new Date(match.date)}
                        countryLeftId={match.countryLeftId}
                        goalsLeft={match.goalsLeft}
                        countryRightId={match.countryRightId}
                        goalsRight={match.goalsRight}
                        filled={match.filled}
                        userGoalsLeft={match.userGoalsLeft}
                        userGoalsRight={match.userGoalsRight}
                  />
                    ))}
                </CardContent>
              </Card>
            ))}
          </CardsContainer>
        </GroupsContainer>
        {props?.finalsStarted && (
          <FinalsContainer full admin>
            <ContainerHeader
              gridArea="matches-header"
              noMarginTop
              noMarginBottom
              sticky
              className={`${styles.stageHeader} ${styles.viewPageHeader}`}
              title={i18n.finalsTitle}
            />
            <BracketsContainer gridArea="matches">
              <BracketTitle full order={0}>{i18n.FINALS_8}</BracketTitle>
              {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_8_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match) => (
                <UserMatchFinalsInput disabled={true} key={match.id} date={new Date(match.date)}
                  userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                  order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon order={9} /><BracketIcon order={9} /><BracketIcon order={9} /><BracketIcon order={9} />
              <BracketTitle order={9} full>{i18n.FINALS_4}</BracketTitle>
              {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_4_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match) => (
                <UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                  order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon order={14} big /><BracketIcon order={14} big />
              <BracketTitle className={bracketOffsetQuarter} order={14} full>{i18n.FINALS_2}</BracketTitle>
              {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_2_")).sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match, index) => (
                <UserMatchFinalsInput showCountryStatus key={match.id} disabled={true}
                  className={className(index === 0 && bracketOffsetQuarter)} date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                  order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
              <BracketIcon className={className(bracketOffsetQuarter)} order={17} big />
              <BracketTitle className={className(bracketOffsetQuarter)} order={17}>{i18n.FINAL}</BracketTitle>
              <BracketTitle order={17}>{i18n.THIRD_PLACE}</BracketTitle>
              {(finalsMatches || []).filter((x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE").sort((a, b) => (a.stage > b.stage ? 1 : -1)).map((match, index) => (
                <UserMatchFinalsInput showCountryStatus className={className(index === 0 && bracketOffsetQuarter)}
                  disabled={true} key={match.id} date={new Date(match.date)}
                  userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                  userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                  userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                  penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                  goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                  countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                  order={getMatchOrder(match.stage)} filled={match.filled} />
              ))}
            </BracketsContainer>
            <BracketsMobileContainer gridArea="matches">
              <CollapsableContainer>
                <Collapsable title={i18n.FINALS_8}>
                  {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_8_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                    <UserMatchFinalsInput disabled={true} key={match.id} date={new Date(match.date)}
                      userCountryLeftId={match.countryLeftId} userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.countryRightId} userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                      order={index + 1} filled={match.filled} />
                  ))}
                </Collapsable>
                <Collapsable title={i18n.FINALS_4}>
                  {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_4_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                    <UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                      order={index + 1 + 8} filled={match.filled} />
                  ))}
                </Collapsable>
                <Collapsable title={i18n.FINALS_2}>
                  {(finalsMatches || []).filter((x) => x.stage.includes("FINALS_2_")).sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                    <UserMatchFinalsInput showCountryStatus key={match.id} disabled={true} date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                      order={index + 1 + 8 + 4} filled={match.filled} />
                  ))}
                </Collapsable>
                <Collapsable title={i18n.FINAL}>
                  {(finalsMatches || []).filter((x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE").sort((a, b) => (a.date > b.date ? 1 : -1)).map((match, index) => (
                    <UserMatchFinalsInput showCountryStatus disabled={true} key={match.id} date={new Date(match.date)}
                      userCountryLeftId={match.userCountryLeftId} userGoalsLeft={match.userGoalsLeft}
                      userCountryRightId={match.userCountryRightId} userGoalsRight={match.userGoalsRight}
                      userPenaltisLeft={match.userPenaltisLeft} userPenaltisRight={match.userPenaltisRight}
                      penaltisLeft={match.penaltisLeft} penaltisRight={match.penaltisRight}
                      goalsLeft={match.goalsLeft} goalsRight={match.goalsRight}
                      countryLeftId={match.countryLeftId} countryRightId={match.countryRightId}
                      order={index + 1 + 8 + 4 + 2} filled={match.filled} highlight={match.stage === "FINALS"} />
                  ))}
                </Collapsable>
              </CollapsableContainer>
            </BracketsMobileContainer>
          </FinalsContainer>
        )}
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
