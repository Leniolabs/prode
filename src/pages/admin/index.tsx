import React from "react";
import { Match, ProdeRoom, User } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { BrandLogo } from "../../components/common/BrandLogo";
import { Button } from "../../components/common/Button";
import {
  HeaderMessage,
  LeniBall,
  HeaderMenu,
  DesktopHeader,
  HeaderIndicator,
} from "../../components/common/Header";
import {
  AdminMatchInput,
  MatchInput,
} from "../../components/common/MatchInput";
import {
  Layout,
  Footer,
  Header,
  Container,
  Card,
  ContainerHeader,
  CardContent,
} from "@/layout";
import { useRequireSession } from "../../hooks";
import { prisma } from "../../lib";
import commonStyles from "../../styles/CommonStyles.module.scss";
import axios from "axios";
import { useRouter } from "next/router";
import { CardsContainer, GroupsContainer } from "../../components/view/Groups";
import { getUserByEmail } from "../../utils/queries";
import { redirectToLogin, redirectToRoot } from "../../utils/redirect";
import { PageLogo } from "../../components/common/PageLogo";
import { Table } from "../../components/common/Table";
import { CloseIcon, LockIcon } from "../../components/common/Icons";
import { ButtonIcon } from "../../components/common/ButtonIcon";
import { LocaleSelect } from "../../components/common/LocaleSelect";

interface HomeProps {
  rooms: (Pick<
    ProdeRoom,
    "id" | "name" | "public" | "password" | "emailDomain"
  > & { playerCount: number })[];
  users: Pick<User, "id" | "email" | "name" | "blocked">[];
  userCount: number;
  roomCount: number;
  prodeCount: number;
}

export default function Home(props: HomeProps) {
  const session = useRequireSession();

  const handleResetMatches = React.useCallback(() => {
    if (confirm("Are you sure")) {
      axios.post("/api/admin/reset").then(() => {});
    }
  }, []);

  const handlePruneDB = React.useCallback(() => {
    if (confirm("Are you sure")) {
      axios.post("/api/admin/prune").then(() => {});
    }
  }, []);

  const handleDeleteRoom = React.useCallback((id: string) => {
    return () => {
      if (confirm("Are you sure")) {
        axios.post(`/api/admin/rooms/${id}/delete`).then(() => {
          window.location.reload();
        });
      }
    };
  }, []);

  const handleBlockPlayer = React.useCallback((id: string) => {
    return () => {
      if (confirm("Are you sure")) {
        axios.post(`/api/admin/users/${id}/block`).then(() => {
          window.location.reload();
        });
      }
    };
  }, []);

  return (
    <Layout>
      <DesktopHeader>
        <HeaderIndicator text="Rooms" value={props.roomCount} />
        <HeaderIndicator text="Users" value={props.userCount} />
        <HeaderIndicator text="Prodes" value={props.prodeCount} />
      </DesktopHeader>
      <Container>
        <GroupsContainer full>
          <ContainerHeader sticky title="ADMIN DASHBOARD"></ContainerHeader>
        </GroupsContainer>
        <Button onClick={handleResetMatches}>RESET MATCHES</Button>
        <Button onClick={handlePruneDB}>PRUNE DB</Button>

        <Card title="LISTA DE PRODES">
          <CardContent>
            <Table
              stripped
              columns={[
                {
                  header: "Delete",
                  accesor: (row) => (
                    <ButtonIcon onClick={handleDeleteRoom(row.id)}>
                      <CloseIcon />
                    </ButtonIcon>
                  ),
                },
                { header: "Nombre", accesor: (row) => row.name },
                {
                  header: "Jugadores",
                  accesor: (row) => row.playerCount,
                  align: "RIGHT",
                  width: "80px",
                  hideInMobile: true,
                },
                {
                  header: "Public",
                  accesor: (row) => (row.public ? "SI" : "NO"),
                  align: "RIGHT",
                  width: "80px",
                  hideInMobile: true,
                },
                {
                  header: "Password",
                  accesor: (row) => row.password,
                  align: "RIGHT",
                  width: "80px",
                  hideInMobile: true,
                },
                {
                  header: "Email Domain",
                  accesor: (row) => row.emailDomain,
                  align: "RIGHT",
                  width: "80px",
                  hideInMobile: true,
                },
              ]}
              data={props.rooms || []}
            />
          </CardContent>
        </Card>

        <Card title="USERS">
          <CardContent>
            <Table
              stripped
              columns={[
                {
                  header: "Delete",
                  accesor: (row) => (
                    <ButtonIcon onClick={handleBlockPlayer(row.id)}>
                      <CloseIcon />
                    </ButtonIcon>
                  ),
                },
                { header: "Nombre", accesor: (row) => row.name },
                {
                  header: "Email",
                  accesor: (row) => row.email,
                  align: "RIGHT",
                },
                {
                  header: "Bloqueado",
                  accesor: (row) => (row.blocked ? "SI" : "NO"),
                  align: "RIGHT",
                },
              ]}
              data={props.users || []}
            />
          </CardContent>
        </Card>
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const page = parseInt(context.query.page?.toString() || "0", 10);
  const pageLength = parseInt(context.query.pageLength?.toString() || "30", 10);

  const session = await getSession(context);
  if (!session?.user?.email)
    return redirectToLogin(context.locale, context.req.url);

  const user = await getUserByEmail(session.user.email);
  if (!user) return redirectToLogin(context.locale, context.req.url);

  if (user.email !== process.env.ADMIN_EMAIL)
    return redirectToRoot(context.locale);

  const rooms = await prisma.prodeRoom.findMany({
    select: {
      id: true,
      password: true,
      name: true,
      public: true,
      _count: true,
      emailDomain: true,
      UserProde: {
        where: {
          userId: user.id,
        },
      },
    },
    skip: pageLength * page,
    take: pageLength,
  });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      blocked: true,
    },
    skip: pageLength * page,
    take: pageLength,
  });

  const userCount = await prisma.user.count();
  const roomCount = await prisma.prodeRoom.count();
  const prodeCount = await prisma.userProde.count({
    where: {
      prodeRoomId: {
        not: null,
      },
    },
  });

  return {
    props: {
      userCount,
      roomCount,
      prodeCount,
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        public: room.public,
        password: room.password,
        emailDomain: room.emailDomain,
        playerCount: room._count.UserProde,
      })),
      users,
    },
  };
}
