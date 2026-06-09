'use client'
import React from "react";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { RoomWelcomeBar } from "@/components/common/Header";
import { Layout, Footer, Container } from "@/layout";
import { useRequireSession } from "@/hooks";
import { Winners } from "@/components/view/Winners";
import { Meta } from "@/components/common/Meta";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface ResultsData {
  id: string;
  name: string;
  roomAdmin: boolean;
  finalsStarted?: boolean;
  room?: Pick<ProdeRoom, "id" | "name" | "emailDomain" | "password" | "pointsGoals" | "pointsPenal" | "pointsWinner" | "public">;
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"> & {
    points: number;
    ranking: number;
  };
  ranking: (Pick<User, "id" | "name" | "image" | "email"> & {
    points: number;
    ranking: number;
  })[];
}

export default function ResultsPage() {
  const session = useRequireSession();
  const params = useParams();
  const id = params?.id as string;
  const i18n = useLocalizedText();

  const { data: props } = useQuery<ResultsData>({ queryKey: ["results-page-data", id], queryFn: () => fetch(`/api/room-results-data?id=${id}`).then((r) => r.json()), enabled: session.status === "authenticated" && !!id });

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout>
      <Meta />
      <RoomWelcomeBar
        id={props?.id}
        name={props?.name}
        room={props?.room}
        userRanking={props?.userRanking}
        roomAdmin={props?.roomAdmin}
      >
        <Button invert href={`/rooms`}>
          {i18n.buttonLabelProdeList}
        </Button>
        <Button invert href={`/${id}/ranking`}>
          {i18n.buttonLabelRanking}
        </Button>
      </RoomWelcomeBar>
      <Container noPadding full>
        <Winners
          firstPlace={props?.ranking?.find((row) => row.ranking === 1)}
          secondPlace={props?.ranking?.find((row) => row.ranking === 2)}
          thirdPlace={props?.ranking?.find((row) => row.ranking === 3)}
          fourthPlace={props?.ranking?.find((row) => row.ranking === 4)}
        />
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
