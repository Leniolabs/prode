import React from "react";
import { BrandLogo } from "../components/common/BrandLogo";
import { Layout, Footer, Container } from "@/layout";
import { Button } from "../components/common/Button";
import { HomeTitle } from "../components/common/HomeTitle";
import Image from "next/image";
import { LeniCamel, Register } from "../components/view/Index";
import { getSession, useSession } from "next-auth/react";
import { finalsStarted, getUserByEmail, prodeEnded } from "../utils/queries";
import {
  redirectToBlocked,
  redirectToFinals,
  redirectToGroups,
  redirectToResults,
  redirectToRooms,
} from "../utils/redirect";
import { GetServerSidePropsContext } from "next";
import { prisma } from "../lib";
import { Meta } from "../components/common/Meta";
import { LocaleSelect } from "../components/common/LocaleSelect";

interface HomeProps {
  authError?: "OAuthAccountNotLinked";
}

export default function Home(props: HomeProps) {
  const session = useSession();

  return (
    <Layout>
      <Meta />
      <Container direction="COL">
        <Image src="/qatar.png" alt="Qatar Logo" width={200} height={200} />
        <HomeTitle>Lenio Prode</HomeTitle>
        {session.status === "unauthenticated" && (
          <Register authError={props.authError} />
        )}
        {session.status === "authenticated" && (
          <Button href="/rooms">Entrar</Button>
        )}
        <LeniCamel />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const error = context.query.error as string;

  const session = await getSession(context);
  const user = session?.user?.email
    ? await getUserByEmail(session.user.email)
    : null;

  if (!user)
    return {
      props: {
        authError: error || null,
      },
    };

  if (user.blocked) return redirectToBlocked(context.locale);

  const userProdeNotTemplate = await prisma.userProde.findMany({
    where: {
      userId: user.id,
      template: false,
    },
    include: {
      prodeRoom: true,
    },
  });

  if (userProdeNotTemplate.length > 1) {
    return redirectToRooms(context.locale);
  } else if (
    userProdeNotTemplate.length === 1 &&
    userProdeNotTemplate[0]?.prodeRoom
  ) {
    if (await prodeEnded()) {
      return redirectToResults(
        userProdeNotTemplate[0]?.prodeRoom,
        context.locale
      );
    }
    
    if (await finalsStarted()) {
      return redirectToFinals(
        context.locale,
        userProdeNotTemplate[0]?.prodeRoom
      );
    }

    return redirectToGroups(context.locale, userProdeNotTemplate[0]?.prodeRoom);
  }

  if (await finalsStarted()) return redirectToFinals(context.locale);
  return redirectToGroups(context.locale);
}
