'use client'
import React from "react";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Button } from "@/components/common/Button";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { HeaderMenu } from "@/components/common/Header/HeaderMenu";
import { Layout, Footer, Card, CardContent } from "@/layout";
import { useRequireSession } from "@/hooks";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Table } from "@/components/common/Table";
import { CloseIcon } from "@/components/common/Icons";
import { ButtonIcon } from "@/components/common/ButtonIcon";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { Meta } from "@/components/common/Meta";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";

interface AdminData {
  rooms: (Pick<ProdeRoom, "id" | "name" | "public" | "password" | "emailDomain"> & { playerCount: number })[];
  users: Pick<User, "id" | "email" | "name" | "blocked">[];
  userCount: number;
  roomCount: number;
  prodeCount: number;
}

export default function AdminPage() {
  const session = useRequireSession();
  const router = useRouter();
  const i18n = useLocalizedText();

  // Admin-only: admin-page-data returns 403 for non-admins — bounce them.
  const { data: props } = useQuery<AdminData | null>({
    queryKey: ["admin-page-data"],
    queryFn: async () => {
      const res = await fetch("/api/admin-page-data");
      if (res.status === 401 || res.status === 403) {
        router.replace("/rooms");
        return null;
      }
      return res.json();
    },
    enabled: session.status === "authenticated",
    retry: false,
  });

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
    <Layout dark className="relative overflow-hidden before:hidden">
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
      >
        <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
          <HeaderMenu compact />
        </div>
      </WelcomeBar>

      <main className="relative z-[1] flex-1 w-full max-w-[1100px] mx-auto px-4 py-[clamp(12px,3vh,36px)] flex flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" href="/admin/groups">
            CARGAR GRUPOS
          </Button>
          <Button variant="secondary" href="/admin/finals">
            CARGAR FINALES
          </Button>
          <Button variant="danger" onClick={handleResetMatches}>
            RESET MATCHES
          </Button>
          <Button variant="danger" onClick={handlePruneDB}>
            PRUNE DB
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="overflow-x-auto">
            <Table
              dark
              stripped
              columns={[
                {
                  header: "Delete",
                  accesor: (row) => (
                    <ButtonIcon onClick={handleDeleteRoom(row.id)}>
                      <CloseIcon color="#e02045" />
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
              data={props?.rooms || []}
            />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="overflow-x-auto">
            <Table
              dark
              stripped
              columns={[
                {
                  header: "Block",
                  accesor: (row) => (
                    <ButtonIcon onClick={handleBlockPlayer(row.id)}>
                      <CloseIcon color="#e02045" />
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
              data={props?.users || []}
            />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
