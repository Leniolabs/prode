import React from "react";
import { ProdeRoom, User } from "@/generated/prisma";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import { DesktopHeader, MobileHeader } from "../../components/common/Header";
import { Layout, Footer, Container } from "@/layout";
import { useRequireSession } from "../../hooks";
import { filterUniquePredicate } from "../../utils/array";
import { Winners } from "../../components/view/Winners";
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
  getUserProde,
  getUserRanking,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from "../../utils/queries";
import { Meta } from "../../components/common/Meta";
import { LocaleSelect } from "../../components/common/LocaleSelect";
import { useLocalizedText } from "../../locale";

interface HomeProps {
  id: string;
  name: string;
  roomAdmin: boolean;
  finalsStarted?: boolean;
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
  userRanking: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points: number;
    ranking: number;
  };
  ranking: (Pick<User, "id" | "name" | "image" | "email"> & {
    points: number;
    ranking: number;
  })[];
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const i18n = useLocalizedText();

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
        <Button invert href={`/${props.id}/ranking`}>
          {i18n.buttonLabelRanking}
        </Button>
      </DesktopHeader>
      <MobileHeader
        list
        id={props.id}
        finalsStarted={props.finalsStarted}
        name={props.name}
        room={props.room}
        userRanking={props.userRanking}
        roomAdmin={props.roomAdmin}
        groups={true}
        finals={true}
      />
      <Container noPadding full>
        <Winners
          firstPlace={props.ranking?.find((row) => row.ranking === 1)}
          secondPlace={props.ranking?.find((row) => row.ranking === 2)}
          thirdPlace={props.ranking?.find((row) => row.ranking === 3)}
          fourthPlace={props.ranking?.find((row) => row.ranking === 4)}
        />
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

  const userInRoom = await isUserRegisteredToRoom(room, user);
  if (!userInRoom) {
    if (shouldPasswordCheck(room))
      return redirectToPasswordCheck(room, context.locale);
    else if (!roomEmailCheck(room, user))
      return redirectToRooms(context.locale);
    await registerUserToRoom(room, user);
  }

  const userProde = await getUserProde(room, user);
  if (!userProde) return redirectToRooms(context.locale);

  const ranking = await getRanking(room, 0, 10);
  const userRanking = await getUserRanking(room, userProde);

  return {
    props: {
      id,
      roomAdmin: room.userId === user.id,
      name: room.name,
      finalsStarted: room.prode.stage == "FINALS",
      room:
        room.userId === user.id
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
        ...ranking.slice(0, 10),
        ...(userRanking ? [userRanking] : []),
      ].filter(filterUniquePredicate((a, b) => a.id === b.id)),
    },
  };
}
