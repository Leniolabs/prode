import React from "react";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { HeaderMessage, LeniBall } from "../../components/common/Header";
import { Layout, Header, Container } from "@/layout";
import { useRequireSession } from "../../hooks";
import { PasswordModal } from "../../components/common/PasswordModal";
import axios from "axios";
import { useRouter } from "next/router";
import {
  redirectToLogin,
  redirectToRanking,
  redirectToRooms,
} from "../../utils/redirect";
import {
  getProdeRoom,
  getUserByEmail,
  isUserRegisteredToRoom,
} from "../../utils/queries";
import { useLocalizedText } from "../../locale";
import { User } from "@prisma/client";

interface HomeProps {
  id: string;
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points?: number;
    ranking?: number;
  };
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  const { id } = props;

  const handlePassword = React.useCallback(
    (password: string) => {
      axios.post(`/api/${id}/checkpassword`, { password }).then((response) => {
        const allowed = response.data?.allowed as boolean;
        if (allowed) {
          router.push(`/${id}/ranking`);
        } else {
          router.push(`/${id}/groups`);
        }
      });
    },
    [id, router]
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout backgroundImage={`/${props.userRanking?.background}.png`}>
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
      </Header>
      <Container>
        <PasswordModal onClose={handlePassword} />
      </Container>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = context.params?.id as string;

  const session = await getSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.resolvedUrl);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  const room = await getProdeRoom(id);
  if (!room) return redirectToRooms(context.locale);

  const userInRoom = await isUserRegisteredToRoom(room, user);
  if (userInRoom) return redirectToRanking(room, context.locale);

  if (
    room.emailDomain &&
    (!user.email || !user.email.endsWith(`@${room.emailDomain}`))
  )
    return redirectToRooms(context.locale);

  return {
    props: {
      id,
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
    },
  };
}
