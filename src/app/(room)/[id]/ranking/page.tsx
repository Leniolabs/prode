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

  // Copy-link feedback state
  const [copyLabel, setCopyLabel] = React.useState<string | null>(null);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyLink = React.useCallback(() => {
    navigator.clipboard.writeText(`${window.location.href}`);
    const feedbackLabel = i18n.locale === "es" ? "Copiado!" : "Copied!";
    setCopyLabel(feedbackLabel);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopyLabel(null);
    }, 1500);
  }, [i18n.locale]);

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
          className="[&>:first-child]:bg-[#00192c] [&>:first-child]:rounded-t-lg [&>:first-child]:text-xl [&>:first-child]:font-semibold [&>:first-child]:leading-tight [&>:first-child]:min-h-[50px] [&>:first-child]:px-5 [&>:first-child]:normal-case [&>:first-child]:flex [&>:first-child]:items-center [&>:first-child]:gap-3 [&>:first-child]:flex-nowrap"
          title={
            <>
              <span className="flex-1 whitespace-nowrap">{i18n.rankingTitle}</span>
              <span className="flex-none text-sm font-normal opacity-80 whitespace-nowrap">
                {i18n.rankingTotalPlayersLabel} {props?.totalPlayers}
              </span>
            </>
          }
        >
          <Button onClick={handleCopyLink}>
            {copyLabel ?? i18n.buttonLabelCopyLink}
          </Button>
          <Button onClick={handleLeaveRoom} variant="danger">
            <ExitIcon /> {i18n.buttonLabelLeave}
          </Button>
        </ContainerHeader>
        <Card className="overflow-hidden">
          {/* Mobile: fixed layout for name ellipsis. Desktop: auto layout + horizontal scroll for wide finals cols */}
          <CardContent>
            {/* Mobile table wrapper */}
            <div className="lg:hidden overflow-hidden">
              <table className="border-collapse table-fixed w-full">
                <thead className="bg-table-header-bg">
                  <tr>
                    {/* Crown/action col */}
                    <th
                      scope="col"
                      style={{ width: "40px", minWidth: "40px", paddingRight: "8px" }}
                      className="h-[55px] text-[20px] text-dark-navy font-semibold text-left px-3 py-[6px] whitespace-nowrap overflow-hidden"
                    />
                    {/* Pos col */}
                    <th
                      scope="col"
                      style={{ width: "50px" }}
                      className="h-[55px] text-[20px] text-dark-navy font-semibold text-left px-3 py-[6px] whitespace-nowrap overflow-hidden"
                    >
                      {i18n.rankingPositionColumn}
                    </th>
                    {/* Name col — grows */}
                    <th
                      scope="col"
                      className="h-[55px] text-[20px] text-dark-navy font-semibold text-left px-3 py-[6px] whitespace-nowrap overflow-hidden"
                    >
                      {i18n.rankingNameColumn}
                    </th>
                    {/* Total col */}
                    <th
                      scope="col"
                      style={{ width: "76px", paddingRight: "16px" }}
                      className="h-[55px] text-[20px] text-dark-navy font-semibold text-right px-3 py-[6px] whitespace-nowrap overflow-hidden"
                    >
                      {i18n.rankingTotalColumn}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(props?.ranking || []).map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => handleUserClick(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleUserClick(row);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="h-[55px] text-[20px] hover:bg-[rgba(0,0,0,0.04)] [&:hover_*]:cursor-pointer"
                    >
                      {/* Crown/action cell */}
                      <td
                        style={{ width: "40px", minWidth: "40px", paddingRight: "8px" }}
                        className="px-3 py-[6px] text-[14px]"
                      >
                        {row.isAdmin ? (
                          <ButtonIcon><CrownIcon /></ButtonIcon>
                        ) : props?.roomAdmin ? (
                          <ButtonIcon onClick={handleRemoveUser(row.id)}>
                            <CloseIcon color="#333" />
                          </ButtonIcon>
                        ) : null}
                      </td>
                      {/* Pos cell */}
                      <td className="px-3 py-[6px] text-[14px]">
                        <UserPositionDisplay position={row.ranking} />
                      </td>
                      {/* Name cell — truncates */}
                      <td className="px-3 py-[6px] text-[14px] overflow-hidden max-w-0">
                        <div className="truncate">
                          <UserRankingDisplay name={row.name || ""} image={row.image} />
                        </div>
                      </td>
                      {/* Total cell */}
                      <td
                        style={{ paddingRight: "16px" }}
                        className="py-[6px] pl-3 text-[14px] text-right"
                      >
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desktop table: auto layout, scroll container is this div */}
            <div className="hidden lg:block overflow-x-auto">
              <div style={{ width: "max-content", minWidth: "100%" }}>
              <Table
                className=""
                onRowClick={handleUserClick}
                columns={[
                  {
                    header: "",
                    width: "40px",
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
                  { header: "A", accesor: (row) => row.GROUP_A, align: "RIGHT" },
                  { header: "B", accesor: (row) => row.GROUP_B, align: "RIGHT" },
                  { header: "C", accesor: (row) => row.GROUP_C, align: "RIGHT" },
                  { header: "D", accesor: (row) => row.GROUP_D, align: "RIGHT" },
                  { header: "E", accesor: (row) => row.GROUP_E, align: "RIGHT" },
                  { header: "F", accesor: (row) => row.GROUP_F, align: "RIGHT" },
                  { header: "G", accesor: (row) => row.GROUP_G, align: "RIGHT" },
                  { header: "H", accesor: (row) => row.GROUP_H, align: "RIGHT" },
                  { header: "I", accesor: (row) => row.GROUP_I, align: "RIGHT" },
                  { header: "J", accesor: (row) => row.GROUP_J, align: "RIGHT" },
                  { header: "K", accesor: (row) => row.GROUP_K, align: "RIGHT" },
                  { header: "L", accesor: (row) => row.GROUP_L, align: "RIGHT" },
                  { header: i18n.ranking8Column, accesor: (row) => row.FINALS_8, align: "RIGHT" },
                  { header: i18n.ranking4Column, accesor: (row) => row.FINALS_4, align: "RIGHT" },
                  { header: i18n.ranking2Column, accesor: (row) => row.FINALS_2, align: "RIGHT" },
                  { header: i18n.ranking1Column, accesor: (row) => row.FINAL, align: "RIGHT" },
                  { header: i18n.rankingTotalColumn, accesor: (row) => row.points, align: "RIGHT", width: "76px" },
                ]}
                data={props?.ranking || []}
                clickable
              />
              </div>
            </div>
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
