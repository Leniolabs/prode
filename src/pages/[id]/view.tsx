import React from "react";
import { Match, ProdeRoom, User } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import { DesktopHeader, MobileHeader } from "../../components/common/Header";
import { MatchInput } from "../../components/common/MatchInput";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  Header,
  CardContent,
} from "@/layout";
import {
  CardsContainer,
  GroupsContainer,
  LeniCard,
} from "../../components/view/Groups";
import { redirectToRooms } from "../../utils/redirect";
import {
  getUserByEmail,
  getUserFinalMatches,
  getUserGroupMatches,
  getUserProde,
  getUserProdeById,
  isUserRegisteredToRoom,
} from "../../utils/queries";
import {
  BracketIcon,
  bracketOffsetQuarter,
  BracketsContainer,
  BracketsMobileContainer,
  BracketTitle,
  FinalsContainer,
} from "../../components/view/Finals";
import { UserMatchFinalsInput } from "../../components/common/UserMatchFinalsInput";
import { className } from "../../utils/classname";
import {
  Collapsable,
  CollapsableContainer,
} from "../../components/common/Collapsable";
import { getMatchOrder } from "../finals";
import { UserImage } from "../../components/common/UserImage";
import { Meta } from "../../components/common/Meta";
import { getGifBuffer } from "../../utils/share";
import { ButtonIcon } from "../../components/common/ButtonIcon";
import { ShareIcon } from "../../components/common/Icons";
import {
  ShareButton,
  ShareProdeStoryButton,
} from "../../components/common/ShareButton";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";
import { ShareToday } from "../../components/common/ShareButton/ShareToday";

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

  countryRightId?: string;
  userCountryRightId?: string;
  userGoalsRight?: number | null;
  userPenaltisRight?: number | null;

  resultStatus: "GOALS_MATCH" | "WINNER_MATCH" | "WRONG";
  countryStatus: "MATCH" | "WRONG";
};

interface HomeProps {
  id: string;
  name?: string;
  userProdeId: string;
  roomAdmin: boolean;
  userInRoom: boolean;
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
    points?: number;
    ranking?: number;
  };
  viewUser: Pick<User, "id" | "name" | "image">;
  ranking?: (Pick<
    User,
    "id" | "name" | "image" | "email" | "background" | "dark"
  > & {
    points: number;
    ranking: number;
  })[];
  matches?: UIMatch[];
  finalsMatches?: UIFinalMatch[];
}

export default function Home(props: HomeProps) {
  const { matches, finalsMatches } = props;
  const i18n = useLocalizedText();

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
      <Meta />
      {props.userRanking && (
        <DesktopHeader
          id={props.id}
          name={props.name}
          room={props.room}
          userRanking={props.userRanking}
          roomAdmin={props.roomAdmin}
        ></DesktopHeader>
      )}
      {props.userRanking && (
        <MobileHeader
          list
          id={props.id}
          name={props.name}
          room={props.room}
          finalsStarted={props.finalsStarted}
          userRanking={props.userRanking}
          roomAdmin={props.roomAdmin}
          groups={props.userInRoom}
          finals={props.userInRoom}
        />
      )}
      <Container full>
        <GroupsContainer full admin>
          <ContainerHeader
            gridArea="matches-header"
            noMarginBottom
            noMarginTop={!props.userRanking}
            variant="SECONDARY"
            title={
              <>
                <UserImage small image={props.viewUser.image} />
                {i18n.viewTitle}
                {props.viewUser.name}
                {i18n.viewTitleAfter}
                <ShareButton
                  big
                  marginLeftAuto
                  userProdeId={props.userProdeId}
                />
                <ShareProdeStoryButton
                  big
                  marginLeftAuto
                  userProdeId={props.userProdeId}
                />
              </>
            }
          />
        </GroupsContainer>
        <GroupsContainer full admin>
          <ContainerHeader
            gridArea="matches-header"
            sticky
            noMarginTop
            title={i18n.groupsTitle}
          />
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
                  {(matches || [])
                    .filter((match) => match.stage === group)
                    .map((match) => (
                      <MatchInput
                        key={match.id}
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
            <LeniCard />
          </CardsContainer>
        </GroupsContainer>
        {props.finalsStarted && (
          <FinalsContainer full admin>
            <ContainerHeader
              gridArea="matches-header"
              noMarginTop
              noMarginBottom
              sticky
              title={i18n.finalsTitle}
            ></ContainerHeader>
            <BracketsContainer gridArea="matches">
              <BracketTitle full order={0}>
                {i18n.FINALS_8}
              </BracketTitle>
              {(finalsMatches || [])
                .filter((x) => x.stage.includes("FINALS_8_"))
                .sort((a, b) => (a.stage > b.stage ? 1 : -1))
                .map((match) => (
                  <UserMatchFinalsInput
                    disabled={true}
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
              {(finalsMatches || [])
                .filter((x) => x.stage.includes("FINALS_4_"))
                .sort((a, b) => (a.stage > b.stage ? 1 : -1))
                .map((match) => (
                  <UserMatchFinalsInput
                    showCountryStatus
                    disabled={true}
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
                    order={getMatchOrder(match.stage)}
                    filled={match.filled}
                  />
                ))}
              <BracketIcon order={14} big />
              <BracketIcon order={14} big />
              <BracketTitle className={bracketOffsetQuarter} order={14} full>
                {i18n.FINALS_2}
              </BracketTitle>
              {(finalsMatches || [])
                .filter((x) => x.stage.includes("FINALS_2_"))
                .sort((a, b) => (a.stage > b.stage ? 1 : -1))
                .map((match, index) => (
                  <UserMatchFinalsInput
                    showCountryStatus
                    key={match.id}
                    disabled={true}
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

              {(finalsMatches || [])
                .filter(
                  (x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE"
                )
                .sort((a, b) => (a.stage > b.stage ? 1 : -1))
                .map((match, index) => (
                  <UserMatchFinalsInput
                    showCountryStatus
                    className={className(index === 0 && bracketOffsetQuarter)}
                    disabled={true}
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
                    order={getMatchOrder(match.stage)}
                    filled={match.filled}
                  />
                ))}
            </BracketsContainer>
            <BracketsMobileContainer gridArea="matches">
              <CollapsableContainer>
                <Collapsable title={i18n.FINALS_8}>
                  {(finalsMatches || [])
                    .filter((x) => x.stage.includes("FINALS_8_"))
                    .sort((a, b) => (a.date > b.date ? 1 : -1))
                    .map((match, index) => (
                      <UserMatchFinalsInput
                        disabled={true}
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
                        order={index + 1}
                        filled={match.filled}
                      />
                    ))}
                </Collapsable>
                <Collapsable title={i18n.FINALS_4}>
                  {(finalsMatches || [])
                    .filter((x) => x.stage.includes("FINALS_4_"))
                    .sort((a, b) => (a.date > b.date ? 1 : -1))
                    .map((match, index) => (
                      <UserMatchFinalsInput
                        showCountryStatus
                        disabled={true}
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
                        order={index + 1 + 8}
                        filled={match.filled}
                      />
                    ))}
                </Collapsable>
                <Collapsable title={i18n.FINALS_2}>
                  {(finalsMatches || [])
                    .filter((x) => x.stage.includes("FINALS_2_"))
                    .sort((a, b) => (a.date > b.date ? 1 : -1))
                    .map((match, index) => (
                      <UserMatchFinalsInput
                        showCountryStatus
                        key={match.id}
                        disabled={true}
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
                        order={index + 1 + 8 + 4}
                        filled={match.filled}
                      />
                    ))}
                </Collapsable>
                <Collapsable title={i18n.FINAL}>
                  {(finalsMatches || [])
                    .filter(
                      (x) => x.stage === "FINALS" || x.stage === "THIRD_PLACE"
                    )
                    .sort((a, b) => (a.date > b.date ? 1 : -1))
                    .map((match, index) => (
                      <UserMatchFinalsInput
                        showCountryStatus
                        disabled={true}
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
                        order={index + 1 + 8 + 4 + 2}
                        filled={match.filled}
                        highlight={match.stage === "FINALS"}
                      />
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const userProdeId = context.params?.id as string;

  const session = await getSession(context);
  const user = session?.user?.email
    ? await getUserByEmail(session.user.email)
    : null;

  const userProde = await getUserProdeById(userProdeId);
  if (!userProde) return redirectToRooms(context.locale);

  const viewUser = userProde.user;
  if (!viewUser || !viewUser.prodePublic)
    return redirectToRooms(context.locale);

  const room = userProde.prodeRoom;
  if (!room) return redirectToRooms(context.locale);

  const viewUserProde = await getUserProde(room, viewUser);
  if (!viewUserProde) return redirectToRooms(context.locale);

  const userInRoom = user ? await isUserRegisteredToRoom(room, user) : false;

  const matches = await getUserGroupMatches(room, viewUser);
  const finalsMatches = await getUserFinalMatches(room, viewUser);

  return {
    props: {
      // metaImage: image,
      id: room.id,
      userProdeId: viewUserProde.id,
      name: room.name,
      roomAdmin: room.userId === user?.id,
      userInRoom,
      viewUser: {
        id: viewUser.id,
        name: viewUser.name,
        image: viewUser.image,
      },
      room:
        room.userId === user?.id
          ? {
              id: room.id,
              name: room.name,
              password: room.password,
              public: room.public,
              emailDomain: room.emailDomain,
              pointsWinner: room.pointsWinner,
              pointsGoals: room.pointsGoals,
              pointsPenal: room.pointsPenal,
            }
          : null,
      finalsStarted: room.prode.stage === "FINALS",
      userRanking: user
        ? {
            id: user.id,
            name: user.name,
            image: user.image,
            email: user.email,
            prodePublic: user.prodePublic,
            background: user.background,
            dark: user.dark,
          }
        : null,
      matches,
      finalsMatches,
    },
  };
}
