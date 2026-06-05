'use client'
import React from "react";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { DesktopHeader, MobileHeader } from "@/components/common/Header";
import {
  Layout,
  Footer,
  Header,
  Container,
  Card,
  CardContent,
} from "@/layout";
import { useRequireSession } from "@/hooks";
import { Button } from "@/components/common/Button";
import { Table } from "@/components/common/Table";
import { LockIcon } from "@/components/common/Icons";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PasswordModal } from "@/components/common/PasswordModal";
import { Meta } from "@/components/common/Meta";
import { Warning } from "@/components/common/Warning";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";

interface RoomsData {
  finalsStarted: boolean;
  rooms: (Pick<ProdeRoom, "id" | "name"> & {
    hasPassword?: boolean;
    playerCount: number;
    open?: boolean;
    alreadyJoin?: boolean;
  })[];
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  >;
  registeredProdes: number;
}

export default function RoomsPage() {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  const { data: props } = useQuery<RoomsData>({ queryKey: ["rooms-page-data"], queryFn: () => fetch("/api/rooms-page-data").then((r) => r.json()), enabled: session.status === "authenticated" });

  const [passwordModalId, setPasswordModalId] = React.useState<string>();

  const onRoomClick = React.useCallback(
    (id: string, hasPassword?: boolean) => {
      return () => {
        if (hasPassword) {
          setPasswordModalId(id);
        } else
          router.push(`/${id}/${props?.finalsStarted ? "finals" : "groups"}`);
      };
    },
    [props?.finalsStarted, router]
  );

  const handlePassword = React.useCallback(
    (password: string) => {
      axios
        .post(`/api/${passwordModalId}/checkpassword`, { password })
        .then((response) => {
          const allowed = response.data?.allowed as boolean;
          setPasswordModalId("");
          if (allowed) {
            router.push(
              `/${passwordModalId}/${props?.finalsStarted ? "finals" : "groups"}`
            );
          }
        });
    },
    [passwordModalId, props?.finalsStarted, router]
  );

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout>
      <Meta />
      <DesktopHeader userRanking={props?.userRanking}>
        {props && props.registeredProdes <= 1 && (
          <Button invert href="/">
            {props?.finalsStarted
              ? i18n.buttonLabelFinalsPhase
              : i18n.buttonLabelGroupPhase}
          </Button>
        )}
        <Button invert href="/new-prode">
          {i18n.buttonLabelCreateRoom}
        </Button>
      </DesktopHeader>
      <MobileHeader
        finalsStarted={props?.finalsStarted}
        userRanking={props?.userRanking}
        create
        groups
      />
      <Warning>{i18n.roomsWarning}</Warning>
      <Container full>
        <Card title={i18n.roomsProdeListTitle}>
          <CardContent>
            <Table
              stripped
              columns={[
                {
                  header: i18n.roomsProdeListColumnName,
                  accesor: (row) => row.name,
                },
                {
                  header: i18n.roomsProdeListColumnPlayers,
                  accesor: (row) => row.playerCount,
                  align: "RIGHT",
                  width: "80px",
                  hideInMobile: true,
                },
                {
                  header: i18n.roomsProdeListColumnMember,
                  accesor: (row) => (row.alreadyJoin ? "Si" : "No"),
                  align: "RIGHT",
                  width: "200px",
                  hideInMobile: true,
                },
                {
                  header: "",
                  align: "RIGHT",
                  width: "250px",
                  accesor: (row) => (
                    <div
                      style={{ display: "flex", placeContent: "center end" }}
                    >
                      {row.hasPassword && <LockIcon open={row.open} />}
                      <Button
                        variant="transparent"
                        onClick={onRoomClick(
                          row.id,
                          row.open ? false : row.hasPassword
                        )}
                      >
                        {row.alreadyJoin
                          ? i18n.roomsProdeListRedirectLabel
                          : i18n.roomsProdeListJoinLabel}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={props?.rooms || []}
            />
          </CardContent>
        </Card>
        {passwordModalId && <PasswordModal onClose={handlePassword} />}
      </Container>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
