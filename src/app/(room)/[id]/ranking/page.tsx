'use client'
import React from "react";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { RoomWelcomeBar } from "@/components/common/Header";
import { Pagination, Table } from "@/components/common/Table";
import { UserPositionDisplay } from "@/components/common/UserPositionDisplay";
import { UserRankingDisplay } from "@/components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useBodyRedirect, useRequireSession } from "@/hooks";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Meta } from "@/components/common/Meta";
import { ButtonIcon } from "@/components/common/ButtonIcon";
import { CloseIcon, CrownIcon, ExitIcon } from "@/components/common/Icons";
import axios from "axios";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";
import styles from "./page.module.scss";

interface RankingData {
  id: string;
  name: string;
  roomAdmin: boolean;
  userProdeId: string;
  finalsStarted: boolean;
  room?: Pick<ProdeRoom, "id" | "name" | "emailDomain" | "password" | "pointsGoals" | "pointsPenal" | "pointsWinner" | "public">;
  totalPlayers: number;
  totalPages: number;
  page: number;
  userRanking: Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"> & {
    points: number;
    ranking: number;
    GROUP_A: number; GROUP_B: number; GROUP_C: number; GROUP_D: number;
    GROUP_E: number; GROUP_F: number; GROUP_G: number; GROUP_H: number;
    GROUP_I: number; GROUP_J: number; GROUP_K: number; GROUP_L: number;
    FINALS_8: number; FINALS_4: number; FINALS_2: number; FINAL: number;
    isAdmin: boolean;
  };
  ranking: (Pick<User, "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"> & {
    points: number; ranking: number;
    GROUP_A: number; GROUP_B: number; GROUP_C: number; GROUP_D: number;
    GROUP_E: number; GROUP_F: number; GROUP_G: number; GROUP_H: number;
    GROUP_I: number; GROUP_J: number; GROUP_K: number; GROUP_L: number;
    FINALS_8: number; FINALS_4: number; FINALS_2: number; FINAL: number;
    isAdmin: boolean;
  })[];
}

type RankingResponse = RankingData & { redirect?: string };

export default function RankingPage() {
  const session = useRequireSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const page = parseInt(searchParams?.get("page") || "0", 10);
  const i18n = useLocalizedText();

  const { data: props } = useQuery<RankingResponse>({ queryKey: ["ranking-page-data", id, page], queryFn: () => fetch(`/api/room-ranking-data?id=${id}&page=${page}`).then((r) => r.json()), enabled: session.status === "authenticated" && !!id });
  const redirected = useBodyRedirect(props?.redirect);

  const handleUserClick = React.useCallback(
    (row: { id: string }) => {
      router.push(`/${row.id}/view`);
    },
    [router]
  );

  const handleLeaveRoom = React.useCallback(() => {
    if (confirm("Estas seguro?")) {
      axios.delete(`/api/${props?.userProdeId}/leave`).then(() => {
        router.push("/rooms");
      });
    }
  }, [props?.userProdeId, router]);

  const handleRemoveUser = React.useCallback(
    (userProdeId: string) => {
      return () => {
        if (confirm("Estas seguro de eliminar este Usuario?")) {
          axios
            .delete(`/api/${userProdeId}/delete`)
            .then(() => {
              router.refresh();
            })
            .catch(() => {});
        }
      };
    },
    [router]
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  if (redirected) return null;

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
        <Button invert href="/rooms">
          {i18n.buttonLabelProdeList}
        </Button>
        {props?.finalsStarted ? (
          <Button invert href={`/${id}/finals`}>
            {i18n.buttonLabelFinalsPhase}
          </Button>
        ) : (
          <Button invert href={`/${id}/groups`}>
            {i18n.buttonLabelGroupPhase}
          </Button>
        )}
      </RoomWelcomeBar>
      <Container full direction="COL">
        <ContainerHeader
          sticky
          className={styles.rankingHeader}
          title={
            <>
              {i18n.rankingTitle}
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                {i18n.rankingTotalPlayersLabel} {props?.totalPlayers}
              </div>
            </>
          }
        >
          <Button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.href}`);
            }}
          >
            {i18n.buttonLabelCopyLink}
          </Button>
          <Button onClick={handleLeaveRoom} variant="danger">
            <ExitIcon /> {i18n.buttonLabelLeave}
          </Button>
        </ContainerHeader>
        <Card>
          <CardContent>
            <Table
              onRowClick={handleUserClick}
              columns={[
                {
                  header: "",
                  width: "32px",
                  accesor: (row) => {
                    if (row.isAdmin) {
                      return <ButtonIcon><CrownIcon /></ButtonIcon>;
                    }
                    if (props?.roomAdmin)
                      return (
                        <ButtonIcon onClick={handleRemoveUser(row.id)}>
                          <CloseIcon color="#333" />
                        </ButtonIcon>
                      );
                    return null;
                  },
                },
                {
                  header: i18n.rankingPositionColumn,
                  accesor: (row) => <UserPositionDisplay position={row.ranking} />,
                  width: "50px",
                },
                {
                  header: i18n.rankingNameColumn,
                  accesor: (row) => <UserRankingDisplay name={row.name || ""} image={row.image} />,
                },
                { header: "A", accesor: (row) => row.GROUP_A, align: "RIGHT", hideInMobile: true },
                { header: "B", accesor: (row) => row.GROUP_B, align: "RIGHT", hideInMobile: true },
                { header: "C", accesor: (row) => row.GROUP_C, align: "RIGHT", hideInMobile: true },
                { header: "D", accesor: (row) => row.GROUP_D, align: "RIGHT", hideInMobile: true },
                { header: "E", accesor: (row) => row.GROUP_E, align: "RIGHT", hideInMobile: true },
                { header: "F", accesor: (row) => row.GROUP_F, align: "RIGHT", hideInMobile: true },
                { header: "G", accesor: (row) => row.GROUP_G, align: "RIGHT", hideInMobile: true },
                { header: "H", accesor: (row) => row.GROUP_H, align: "RIGHT", hideInMobile: true },
                { header: "I", accesor: (row) => row.GROUP_I, align: "RIGHT", hideInMobile: true },
                { header: "J", accesor: (row) => row.GROUP_J, align: "RIGHT", hideInMobile: true },
                { header: "K", accesor: (row) => row.GROUP_K, align: "RIGHT", hideInMobile: true },
                { header: "L", accesor: (row) => row.GROUP_L, align: "RIGHT", hideInMobile: true },
                { header: i18n.ranking8Column, accesor: (row) => row.FINALS_8, align: "RIGHT", hideInMobile: true },
                { header: i18n.ranking4Column, accesor: (row) => row.FINALS_4, align: "RIGHT", hideInMobile: true },
                { header: i18n.ranking2Column, accesor: (row) => row.FINALS_2, align: "RIGHT", hideInMobile: true },
                { header: i18n.ranking1Column, accesor: (row) => row.FINAL, align: "RIGHT", hideInMobile: true },
                { header: i18n.rankingTotalColumn, accesor: (row) => row.points, align: "RIGHT", width: "50px" },
              ]}
              data={props?.ranking || []}
              clickable
            />
          </CardContent>
        </Card>
        <Pagination page={props?.page ?? 0} totalPages={props?.totalPages ?? 0} />
      </Container>
      <Footer>
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
