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
import { useParams, useRouter } from "next/navigation";
import { useBodyRedirect } from "@/hooks";
import Link from "next/link";

// ContainerHeader title-bar styling (applied to the header's first child).
const headerDarkTitle =
  "[&>:first-child]:bg-[#00192c] [&>:first-child]:text-white [&>:first-child]:rounded-card [&>:first-child]:text-[20px] [&>:first-child]:font-semibold [&>:first-child]:leading-[1.15] [&>:first-child]:min-h-[50px] [&>:first-child]:px-5 [&>:first-child]:normal-case";
const headerGreenTitle =
  "[&>:first-child]:bg-brand-green [&>:first-child]:text-white [&>:first-child]:rounded-card [&>:first-child]:text-[25px] [&>:first-child]:font-bold [&>:first-child]:leading-[1.15] [&>:first-child]:pt-[11px] [&>:first-child]:px-5 [&>:first-child]:pb-[13px] [&>:first-child]:normal-case";
const groupCardClass =
  "rounded-card overflow-hidden [&>:first-child]:bg-white [&>:first-child]:text-brand-blue [&>:first-child]:text-[16px] [&>:first-child]:font-bold [&>:first-child]:leading-none [&>:first-child]:min-h-[28px] [&>:first-child]:px-3 [&>:first-child]:pt-[7px] [&>:first-child]:pb-[5px] [&>:first-child]:uppercase";
const matchPairBg = ["bg-[#f6f5f5]", "bg-[#ededed]", "bg-[#e1e1e1]"];

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
  const router = useRouter();
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
        <GroupsContainer full admin className="!gap-x-3 !gap-y-0">
          <ContainerHeader
            gridArea="matches-header"
            className={`${headerDarkTitle} !mb-[9px] max-lg:!mt-0`}
            noMarginTop={!props?.userRanking}
            title={
              <div className="relative flex w-full items-center min-h-[1em]">
                <button
                  onClick={() => router.back()}
                  className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap transition hover:bg-white/10 cursor-pointer"
                >
                  ‹ {i18n.buttonLabelBack}
                </button>
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none gap-2">
                  <UserImage
                    small
                    image={props?.viewUser?.image}
                    className="pointer-events-auto"
                  />
                  <span>
                    {i18n.viewTitle}
                    {props?.viewUser?.name}
                    {i18n.viewTitleAfter}
                  </span>
                </span>
                <div className="shrink-0 ml-auto">
                  {props?.id && (
                    <Link
                      href={`/${props.id}/ranking`}
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap transition hover:bg-white/10"
                    >
                      {i18n.buttonLabelGoToMyProde} ›
                    </Link>
                  )}
                </div>
              </div>
            }
          />
        </GroupsContainer>
        <GroupsContainer full admin className="!gap-x-3 !gap-y-0">
          <ContainerHeader
            gridArea="matches-header"
            sticky
            noMarginTop
            noMarginBottom
            className={`${headerDarkTitle} !mb-[12px] max-lg:!mt-0`}
            title={i18n.groupsTitle}
          />
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
                  {(matches || [])
                    .filter((match) => match.stage === group)
                    .map((match, index) => (
                      <MatchInput
                        key={match.id}
                        className={matchPairBg[Math.floor(index / 2)]}
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
              className={`${headerGreenTitle} !mb-[12px] max-lg:!mt-0`}
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
        <LocaleSelect />
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
