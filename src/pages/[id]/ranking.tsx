import React from "react";
import { ProdeRoom, User } from '@/generated/prisma';
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import { DesktopHeader, MobileHeader } from "../../components/common/Header";
import { Pagination, Table } from "../../components/common/Table";
import { UserPositionDisplay } from "../../components/common/UserPositionDisplay";
import { UserRankingDisplay } from "../../components/common/UserRankingDisplay";
import {
  Layout,
  Footer,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import {
  redirectToLogin,
  redirectToPasswordCheck,
  redirectToRooms,
  roomEmailCheck,
  shouldPasswordCheck,
} from "../../utils/redirect";
import {
  getProdeRoom,
  getUserByEmail,
  getUserProde,
  registerUserToRoom,
  countUsersInProdeRoom,
  getUserRanking,
  getFullRanking,
} from "../../utils/queries";
import { useRouter } from "next/router";
import { Meta } from "../../components/common/Meta";
import { ButtonIcon } from "../../components/common/ButtonIcon";
import { CloseIcon, CrownIcon, ExitIcon } from "../../components/common/Icons";
import axios from "axios";
import { useLocalizedText } from "../../locale";

interface HomeProps {
  id: string;
  name: string;
  roomAdmin: boolean;
  userProdeId: string;
  finalsStarted: boolean;
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
  totalPlayers: number;
  totalPages: number;
  page: number;
  userRanking: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"
  > & {
    points: number;
    ranking: number;
    GROUP_A: number;
    GROUP_B: number;
    GROUP_C: number;
    GROUP_D: number;
    GROUP_E: number;
    GROUP_F: number;
    GROUP_G: number;
    GROUP_H: number;
    FINALS_8: number;
    FINALS_4: number;
    FINALS_2: number;
    FINAL: number;
    isAdmin: boolean;
  };
  ranking: (Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "dark" | "background"
  > & {
    points: number;
    ranking: number;
    GROUP_A: number;
    GROUP_B: number;
    GROUP_C: number;
    GROUP_D: number;
    GROUP_E: number;
    GROUP_F: number;
    GROUP_G: number;
    GROUP_H: number;
    FINALS_8: number;
    FINALS_4: number;
    FINALS_2: number;
    FINAL: number;
    isAdmin: boolean;
  })[];
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();
  const router = useRouter();

  const i18n = useLocalizedText();

  const handleUserClick = React.useCallback(
    (row: typeof props.userRanking) => {
      router.push(`/${row.id}/view`);
    },
    [props.id]
  );

  const handleLeaveRoom = React.useCallback(() => {
    if (confirm("Estas seguro?")) {
      axios.delete(`/api/${props.userProdeId}/leave`).then(() => {
        router.push("/rooms");
      });
    }
  }, [props.userProdeId]);

  const handleRemoveUser = React.useCallback(
    (userProdeId: string) => {
      return () => {
        if (confirm("Estas seguro de eliminar este Usuario?")) {
          axios
            .delete(`/api/${userProdeId}/delete`)
            .then(() => {
              router.reload();
            })
            .catch(() => {});
        }
      };
    },
    [props.id, router]
  );

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
        <Button invert href="/rooms">
          {i18n.buttonLabelProdeList}
        </Button>
        {props.finalsStarted ? (
          <Button invert href={`/${props.id}/finals`}>
            {i18n.buttonLabelFinalsPhase}
          </Button>
        ) : (
          <Button invert href={`/${props.id}/groups`}>
            {i18n.buttonLabelGroupPhase}
          </Button>
        )}
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
        shareUserProdeId={props.userProdeId}
      />
      <Container full direction="COL">
        <ContainerHeader
          sticky
          title={
            <>
              {i18n.rankingTitle}
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                {i18n.rankingTotalPlayersLabel} {props.totalPlayers}
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
                      return (
                        <ButtonIcon>
                          <CrownIcon />
                        </ButtonIcon>
                      );
                    }
                    if (props.roomAdmin)
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
                  accesor: (row) => (
                    <UserPositionDisplay position={row.ranking} />
                  ),
                  width: "50px",
                },
                {
                  header: i18n.rankingNameColumn,
                  accesor: (row) => (
                    <UserRankingDisplay
                      name={row.name || ""}
                      image={row.image}
                    />
                  ),
                },
                {
                  header: "A",
                  accesor: (row) => row.GROUP_A,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "B",
                  accesor: (row) => row.GROUP_B,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "C",
                  accesor: (row) => row.GROUP_C,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "D",
                  accesor: (row) => row.GROUP_D,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "E",
                  accesor: (row) => row.GROUP_E,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "F",
                  accesor: (row) => row.GROUP_F,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "G",
                  accesor: (row) => row.GROUP_G,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: "H",
                  accesor: (row) => row.GROUP_H,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: i18n.ranking8Column,
                  accesor: (row) => row.FINALS_8,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: i18n.ranking4Column,
                  accesor: (row) => row.FINALS_4,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: i18n.ranking2Column,
                  accesor: (row) => row.FINALS_2,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: i18n.ranking1Column,
                  accesor: (row) => row.FINAL,
                  align: "RIGHT",
                  hideInMobile: true,
                },
                {
                  header: i18n.rankingTotalColumn,
                  accesor: (row) => row.points,
                  align: "RIGHT",
                  width: "50px",
                },
              ]}
              data={props.ranking || []}
              clickable
            />
          </CardContent>
        </Card>
        <Pagination page={props.page} totalPages={props.totalPages} />
      </Container>
      <Footer>
        <BrandLogo />
      </Footer>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = context.params?.id as string;
  const page = parseInt(context.query.page?.toString() || "0", 10);
  const pageLength = parseInt(context.query.pageLength?.toString() || "30", 10);

  const session = await getSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  const room = await getProdeRoom(id);
  if (!room) return redirectToRooms(context.locale);

  let userProdeId = (await getUserProde(room, user))?.id;
  if (!userProdeId) {
    if (shouldPasswordCheck(room))
      return redirectToPasswordCheck(room, context.locale);
    else if (!roomEmailCheck(room, user))
      return redirectToRooms(context.locale);
    userProdeId = (await registerUserToRoom(room, user))?.id;
  }

  const userProde = await getUserProde(room, user);
  if (!userProde) return redirectToRooms(context.locale);

  const totalUsers = await countUsersInProdeRoom(room.id);
  const totalPages = Math.ceil((totalUsers || 0) / (pageLength || 1));

  const ranking = (await getFullRanking(room, page, pageLength)).map(
    (rank) => ({
      ...rank,
      isAdmin: rank.userId === room.userId,
    })
  );
  const userRanking = await getUserRanking(room, userProde);

  return {
    props: {
      id,
      userProdeId,
      roomAdmin: room.userId === user.id,
      name: room.name,
      finalsStarted: room.prode.stage === "FINALS",
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
      page: page,
      totalPages: totalPages,
      totalPlayers: totalUsers,
      ranking,
    },
  };
}
