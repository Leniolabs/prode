import React from "react";
import { BrandLogo } from "../components/common/BrandLogo";
import { Layout, Footer, Container } from "@/layout";
import Image from "next/image";
import { LeniCamel } from "../components/view/Index";
import { redirectToLogin, redirectToRooms } from "../utils/redirect";
import { getPageSession } from "@/lib/auth/getPageSession";
import { GetServerSidePropsContext } from "next";
import { isUserBlocked } from "../utils/queries";
import { LocaleSelect } from "../components/common/LocaleSelect";

export default function Home() {
  return (
    <Layout>
      <Container direction="COL">
        <Image src="/qatar.png" alt="Qatar Logo" width={200} height={200} />
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
  const session = await getPageSession(context);
  if (session?.user?.email) {
    const userBlocked = await isUserBlocked(session.user.email);
    if (!userBlocked) {
      return redirectToRooms();
    }
  }

  return {
    props: {},
  };
}
