"use client";
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
import { usePathname, useRouter, useParams, useSearchParams } from "next/navigation";
import { Meta } from "@/components/common/Meta";
import { ButtonIcon } from "@/components/common/ButtonIcon";
import { CloseIcon, CrownIcon, ExitIcon } from "@/components/common/Icons";
import { LeaveRoomConfirmModal } from "@/components/common/LeaveRoomConfirmModal";
import { UserImage } from "@/components/common/UserImage";
import axios from "axios";
import { useLocalizedText } from "@/locale";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { className } from "@/utils/classname";
import type { RankingHistogramBucket } from "@/lib/ranking";

interface RankingData {
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
    GROUP_I: number;
    GROUP_J: number;
    GROUP_K: number;
    GROUP_L: number;
    FINALS_16: number;
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
    GROUP_I: number;
    GROUP_J: number;
    GROUP_K: number;
    GROUP_L: number;
    FINALS_16: number;
    FINALS_8: number;
    FINALS_4: number;
    FINALS_2: number;
    FINAL: number;
    isAdmin: boolean;
  })[];
  stats: {
    points: RankingHistogramBucket[];
    groupOutcomeHits: RankingHistogramBucket[];
    exactFinalGoals: RankingHistogramBucket[];
    viewer?: {
      points: number;
      groupOutcomeHits: number;
      exactFinalGoals: number;
    };
  };
}

type RankingResponse = RankingData & { redirect?: string };

type RankingView = "list" | "stats";

function HistogramCard(props: {
  title: string;
  subtitle: string;
  buckets: RankingHistogramBucket[];
  emptyLabel: string;
  marker?: {
    value: number;
    image?: string | null;
    label: string;
  };
}) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = React.useState(0);

  React.useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const updateWidth = () => {
      setHostWidth(element.clientWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const maxCount = Math.max(...props.buckets.map((bucket) => bucket.count), 0);
  const chartHeight = 160;
  const chartWidth = Math.max(hostWidth || 0, 220);
  const chartPaddingX = 12;
  const chartInnerWidth = Math.max(chartWidth - chartPaddingX * 2, 0);
  const bucketCount = Math.max(props.buckets.length, 1);
  const slotWidth = chartInnerWidth / bucketCount;
  const barWidth = Math.max(18, Math.min(56, slotWidth * 0.7));
  const gap = Math.max(4, slotWidth - barWidth);
  const axisLabelStep = Math.max(1, Math.ceil(props.buckets.length / 5));
  const showCounts = slotWidth >= 32 || props.buckets.length <= 8;
  const markerIndex =
    props.marker && props.buckets.length > 0
      ? (() => {
          const exactIndex = props.buckets.findIndex(
            (bucket) => bucket.value === props.marker?.value,
          );
          if (exactIndex >= 0) return exactIndex;

          const rangedIndex = props.buckets.findIndex((bucket, index) => {
            const nextBucket = props.buckets[index + 1];
            return (
              props.marker &&
              props.marker.value >= bucket.value &&
              (!nextBucket || props.marker.value < nextBucket.value)
            );
          });

          if (rangedIndex >= 0) return rangedIndex;
          return props.marker.value < props.buckets[0].value
            ? 0
            : props.buckets.length - 1;
        })()
      : null;
  const markerX =
    markerIndex === null
      ? null
      : chartPaddingX + markerIndex * slotWidth + slotWidth / 2;

  return (
    <Card className="overflow-hidden border border-white/10 bg-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-[18px] font-semibold text-dark-navy">
            {props.title}
          </h3>
          <p className="text-[14px] text-dark-navy/70">{props.subtitle}</p>
        </div>
        {props.buckets.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-dark-navy/15 bg-dark-navy/5 px-4 py-8 text-center text-[14px] text-dark-navy/70">
            {props.emptyLabel}
          </div>
        ) : (
          <div ref={hostRef} className="pb-1">
            <div className="relative h-[194px] w-full">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight + 34}`}
                className="block h-full w-full"
                role="img"
                aria-label={props.title}
              >
                <line
                  x1={chartPaddingX}
                  y1={chartHeight}
                  x2={chartWidth - chartPaddingX}
                  y2={chartHeight}
                  stroke="#00192C"
                  strokeOpacity="0.14"
                  strokeWidth="2"
                />
                {props.buckets.map((bucket, index) => {
                  const height =
                    maxCount > 0 && bucket.count > 0
                      ? Math.max((bucket.count / maxCount) * chartHeight, 8)
                      : 0;
                  const x =
                    chartPaddingX + index * slotWidth + (slotWidth - barWidth) / 2;
                  const y = chartHeight - height;
                  const showLabel =
                    index === 0 ||
                    index === props.buckets.length - 1 ||
                    index % axisLabelStep === 0 ||
                    index === markerIndex;

                  return (
                    <g key={bucket.label} transform={`translate(${x}, 0)`}>
                      <rect
                        x="0"
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="12"
                        fill="#4597D3"
                      />
                      {showCounts && (
                        <text
                          x={barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          className="fill-dark-navy text-[12px] font-semibold"
                        >
                          {bucket.count}
                        </text>
                      )}
                      {showLabel && (
                        <text
                          x={barWidth / 2}
                          y={chartHeight + 18}
                          textAnchor="middle"
                          className="fill-dark-navy text-[10px] font-semibold"
                        >
                          {bucket.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              {props.marker && markerX !== null && (
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                >
                  <div
                    className="absolute top-0 flex h-full flex-col items-center"
                    style={{
                      left: `${(markerX / Math.max(chartWidth, 1)) * 100}%`,
                    }}
                  >
                    <div className="-translate-x-1/2 flex flex-col items-center">
                      <div className="flex items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[0_10px_24px_rgba(0,25,44,0.18)]">
                        <UserImage
                          small
                          image={props.marker.image}
                          alt={props.marker.label}
                          className="shadow-none"
                        />
                      </div>
                      <div className="mt-1 rounded-full bg-dark-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                        {props.marker.label}
                      </div>
                      <div className="mt-2 h-full w-px bg-dark-navy/30" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RankingPage() {
  const session = useRequireSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const page = parseInt(searchParams?.get("page") || "0", 10);
  const view: RankingView = searchParams?.get("view") === "stats" ? "stats" : "list";
  const i18n = useLocalizedText();

  // Copy-link feedback state
  const [copyLabel, setCopyLabel] = React.useState<string | null>(null);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleViewChange = React.useCallback(
    (nextView: RankingView) => {
      const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");
      if (nextView === "stats") nextSearchParams.set("view", "stats");
      else nextSearchParams.delete("view");

      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname!}?${nextQuery}` : pathname!, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleCopyLink = React.useCallback(() => {
    navigator.clipboard.writeText(`${window.location.href}`);
    const feedbackLabel = i18n.locale === "es" ? "Copiado!" : "Copied!";
    setCopyLabel(feedbackLabel);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopyLabel(null);
    }, 1500);
  }, [i18n.locale]);

  const { data: props } = useQuery<RankingResponse>({
    queryKey: ["ranking-page-data", id, page],
    queryFn: () =>
      fetch(`/api/room-ranking-data?id=${id}&page=${page}`).then((r) =>
        r.json(),
      ),
    enabled: session.status === "authenticated" && !!id,
    placeholderData: keepPreviousData,
  });
  const redirected = useBodyRedirect(props?.redirect);

  const handleUserClick = React.useCallback(
    (row: { id: string }) => {
      router.push(`/${row.id}/view`);
    },
    [router],
  );

  const [leaveModalOpen, setLeaveModalOpen] = React.useState(false);

  const handleLeaveRoom = React.useCallback(() => {
    setLeaveModalOpen(true);
  }, []);

  const handleLeaveCancel = React.useCallback(() => {
    setLeaveModalOpen(false);
  }, []);

  const handleLeaveConfirm = React.useCallback(() => {
    setLeaveModalOpen(false);
    axios.delete(`/api/${props?.userProdeId}/leave`).then(() => {
      router.push("/rooms");
    });
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
    [router],
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
      </RoomWelcomeBar>
      <Container full direction="COL" className="mt-3">
        <ContainerHeader
          sticky
          className="gap-3 [&>:first-child]:bg-[#00192c] [&>:first-child]:rounded-lg [&>:first-child]:text-xl [&>:first-child]:font-semibold [&>:first-child]:leading-tight [&>:first-child]:min-h-[50px] [&>:first-child]:py-0 [&>:first-child]:px-5 [&>:first-child]:normal-case [&>:first-child]:flex [&>:first-child]:items-center [&>:first-child]:gap-3 [&>:first-child]:flex-nowrap"
          title={
            <>
              <button
                onClick={() => router.back()}
                className="inline-flex flex-none items-center justify-center rounded-md border border-white/40 px-3 py-[5px] text-[13px] font-semibold leading-none text-white whitespace-nowrap transition hover:bg-white/10 cursor-pointer"
              >
                ‹ {i18n.buttonLabelBack}
              </button>
              <span className="flex-1 whitespace-nowrap">
                {i18n.rankingTitle}
              </span>
              <span className="flex-none text-xl font-semibold whitespace-nowrap">
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
        <div className="mt-4 mb-4 flex w-full flex-wrap items-center justify-start gap-3">
          <div className="inline-flex rounded-button bg-white/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              aria-pressed={view === "list"}
              className={className(
                "rounded-button px-4 py-2 text-[14px] font-semibold transition",
                view === "list"
                  ? "bg-dark-navy text-white"
                  : "text-dark-navy hover:bg-dark-navy/5",
              )}
            >
              {i18n.rankingViewListLabel}
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("stats")}
              aria-pressed={view === "stats"}
              className={className(
                "rounded-button px-4 py-2 text-[14px] font-semibold transition",
                view === "stats"
                  ? "bg-dark-navy text-white"
                  : "text-dark-navy hover:bg-dark-navy/5",
              )}
              >
              {i18n.rankingViewStatsLabel}
            </button>
          </div>
        </div>
        {view === "list" ? (
          <>
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
                          style={{
                            width: "40px",
                            minWidth: "40px",
                            paddingRight: "8px",
                          }}
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
                            style={{
                              width: "40px",
                              minWidth: "40px",
                              paddingRight: "8px",
                            }}
                            className="px-3 py-[6px] text-[14px]"
                          >
                            {row.isAdmin ? (
                              <ButtonIcon>
                                <CrownIcon />
                              </ButtonIcon>
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
                              <UserRankingDisplay
                                name={row.name || ""}
                                image={row.image}
                              />
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
                              return (
                                <ButtonIcon>
                                  <CrownIcon />
                                </ButtonIcon>
                              );
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
                        },
                        {
                          header: "B",
                          accesor: (row) => row.GROUP_B,
                          align: "RIGHT",
                        },
                        {
                          header: "C",
                          accesor: (row) => row.GROUP_C,
                          align: "RIGHT",
                        },
                        {
                          header: "D",
                          accesor: (row) => row.GROUP_D,
                          align: "RIGHT",
                        },
                        {
                          header: "E",
                          accesor: (row) => row.GROUP_E,
                          align: "RIGHT",
                        },
                        {
                          header: "F",
                          accesor: (row) => row.GROUP_F,
                          align: "RIGHT",
                        },
                        {
                          header: "G",
                          accesor: (row) => row.GROUP_G,
                          align: "RIGHT",
                        },
                        {
                          header: "H",
                          accesor: (row) => row.GROUP_H,
                          align: "RIGHT",
                        },
                        {
                          header: "I",
                          accesor: (row) => row.GROUP_I,
                          align: "RIGHT",
                        },
                        {
                          header: "J",
                          accesor: (row) => row.GROUP_J,
                          align: "RIGHT",
                        },
                        {
                          header: "K",
                          accesor: (row) => row.GROUP_K,
                          align: "RIGHT",
                        },
                        {
                          header: "L",
                          accesor: (row) => row.GROUP_L,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.ranking16Column,
                          accesor: (row) => row.FINALS_16,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.ranking8Column,
                          accesor: (row) => row.FINALS_8,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.ranking4Column,
                          accesor: (row) => row.FINALS_4,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.ranking2Column,
                          accesor: (row) => row.FINALS_2,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.ranking1Column,
                          accesor: (row) => row.FINAL,
                          align: "RIGHT",
                        },
                        {
                          header: i18n.rankingTotalColumn,
                          accesor: (row) => row.points,
                          align: "RIGHT",
                          width: "76px",
                        },
                      ]}
                      data={props?.ranking || []}
                      clickable
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Pagination
              page={props?.page ?? 0}
              totalPages={props?.totalPages ?? 0}
            />
          </>
        ) : (
          <div
            className="w-full space-y-4 self-stretch"
            style={{ width: "100%", flexBasis: "100%" }}
          >
            <HistogramCard
              title={i18n.rankingStatsPointsTitle}
              subtitle={i18n.rankingStatsPointsSubtitle}
              buckets={props?.stats?.points ?? []}
              emptyLabel={i18n.rankingStatsEmptyLabel}
              marker={
                props?.stats?.viewer
                  ? {
                      value: props.stats.viewer.points,
                      image: props.userRanking?.image,
                      label: "Tú",
                    }
                  : undefined
              }
            />
            <HistogramCard
              title={i18n.rankingStatsOutcomeTitle}
              subtitle={i18n.rankingStatsOutcomeSubtitle}
              buckets={props?.stats?.groupOutcomeHits ?? []}
              emptyLabel={i18n.rankingStatsEmptyLabel}
              marker={
                props?.stats?.viewer
                  ? {
                      value: props.stats.viewer.groupOutcomeHits,
                      image: props.userRanking?.image,
                      label: "Tú",
                    }
                  : undefined
              }
            />
            <HistogramCard
              title={i18n.rankingStatsExactFinalTitle}
              subtitle={i18n.rankingStatsExactFinalSubtitle}
              buckets={props?.stats?.exactFinalGoals ?? []}
              emptyLabel={i18n.rankingStatsEmptyLabel}
              marker={
                props?.stats?.viewer
                  ? {
                      value: props.stats.viewer.exactFinalGoals,
                      image: props.userRanking?.image,
                      label: "Tú",
                    }
                  : undefined
              }
            />
          </div>
        )}
      </Container>
      <Footer>
        <BrandLogo />
      </Footer>
      {leaveModalOpen && (
        <LeaveRoomConfirmModal
          onCancel={handleLeaveCancel}
          onConfirm={handleLeaveConfirm}
        />
      )}
    </Layout>
  );
}
