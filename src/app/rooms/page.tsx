"use client";
import React from "react";
import Image from "next/image";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { HeaderMenu } from "@/components/common/Header/HeaderMenu";
import { LocaleSelect } from "@/components/common/LocaleSelect";
import { Layout, Footer } from "@/layout";
import { useRequireSession } from "@/hooks";
import { Button } from "@/components/common/Button";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PasswordModal } from "@/components/common/PasswordModal";
import { EditRoomModal } from "@/components/view/EditRoomModal";
import { Meta } from "@/components/common/Meta";
import { useLocalizedText } from "@/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoIcon } from "@/components/common/Icons";

const pageContentClass =
  "flex-1 w-[min(100%,1080px)] mx-auto mt-[clamp(24px,5vh,56px)] mb-[clamp(24px,6vh,64px)] px-6 relative z-[1] max-[900px]:px-[18px] max-[640px]:px-3 max-[640px]:min-h-[unset]";
const ctaRowClass =
  "flex flex-col items-center pt-[clamp(20px,4vh,54px)] pb-[clamp(18px,3vh,34px)] gap-[18px] relative z-[1] max-[900px]:pt-[26px] max-[640px]:gap-[14px]";
const ctaButtonClass =
  "!min-w-[226px] !min-h-[54px] justify-center !px-7 !py-3 !text-[20px] !text-dark-navy !rounded-[10px] !border-0 shadow-[0_10px_22px_rgba(0,0,0,0.12)] max-[640px]:!min-w-[210px] max-[640px]:!min-h-[50px]";
const dividerClass =
  "flex items-center w-full max-w-[552px] text-white/[0.92] text-[18px] font-bold tracking-[0.12em] before:content-[''] before:flex-1 before:border-t before:border-white/[0.78] before:mx-[22px] after:content-[''] after:flex-1 after:border-t after:border-white/[0.78] after:mx-[22px] max-[640px]:max-w-full max-[640px]:text-[15px] max-[640px]:before:mx-3 max-[640px]:after:mx-3";
const roomsPanelClass =
  "w-[min(100%,980px)] mx-auto rounded-card overflow-hidden border-2 border-[rgba(91,194,167,0.95)] bg-[rgba(255,255,255,0.98)] shadow-[0_14px_36px_rgba(0,0,0,0.08)]";
const roomsPanelHeaderClass =
  "bg-brand-green text-white text-center pt-[18px] px-6 pb-4 [&_h1]:m-0 [&_h1]:text-[25px] [&_h1]:font-bold [&_h1]:leading-[1.15] max-[640px]:pt-4 max-[640px]:px-5 max-[640px]:pb-[14px]";
const roomsPanelBodyClass =
  "px-3 pt-4 pb-[18px] flex flex-col gap-3 [&_p]:text-[20px] [&_p]:text-black max-[640px]:p-2.5 max-[640px]:[&_p]:text-[14px]";
const enterButtonClass =
  "min-w-24 h-10 rounded-[9px] border-[1.5px] border-dark-navy bg-white text-dark-navy text-[20px] font-bold leading-none cursor-pointer transition duration-150 enabled:hover:bg-[#f1f3f5] enabled:hover:shadow-sm enabled:active:scale-[0.97] disabled:opacity-35 disabled:cursor-default max-[640px]:min-w-[76px] max-[640px]:h-9 max-[640px]:text-[17px] max-[640px]:px-2.5";

type EditableRoom = Pick<
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

interface RoomsData {
  finalsStarted: boolean;
  prodeEnd?: string | null;
  rooms: (Pick<ProdeRoom, "id" | "name"> & {
    hasPassword?: boolean;
    playerCount: number;
    open?: boolean;
    alreadyJoin?: boolean;
    isCreator?: boolean;
    room?: EditableRoom;
  })[];
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  >;
  registeredProdes: number;
}

function PlayersIcon() {
  return (
    <svg
      width="23"
      height="18"
      viewBox="0 0 23 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8.86328 7.23438C10.7961 7.23438 12.3633 5.66715 12.3633 3.73438C12.3633 1.8016 10.7961 0.234375 8.86328 0.234375C6.93051 0.234375 5.36328 1.8016 5.36328 3.73438C5.36328 5.66715 6.93051 7.23438 8.86328 7.23438Z"
        fill="currentColor"
      />
      <path
        d="M15.8633 7.73438C17.3821 7.73438 18.6133 6.50316 18.6133 4.98438C18.6133 3.46559 17.3821 2.23438 15.8633 2.23438C14.3445 2.23438 13.1133 3.46559 13.1133 4.98438C13.1133 6.50316 14.3445 7.73438 15.8633 7.73438Z"
        fill="currentColor"
        fillOpacity="0.82"
      />
      <path
        d="M1.86328 8.23438C3.38206 8.23438 4.61328 7.00316 4.61328 5.48438C4.61328 3.96559 3.38206 2.73438 1.86328 2.73438C0.344499 2.73438 -0.886719 3.96559 -0.886719 5.48438C-0.886719 7.00316 0.344499 8.23438 1.86328 8.23438Z"
        fill="currentColor"
        fillOpacity="0.82"
      />
      <path
        d="M8.86299 9.23438C4.72085 9.23438 1.36299 11.9207 1.36299 15.2344C1.36299 15.7867 1.81071 16.2344 2.36299 16.2344H15.363C15.9153 16.2344 16.363 15.7867 16.363 15.2344C16.363 11.9207 13.0051 9.23438 8.86299 9.23438Z"
        fill="currentColor"
      />
      <path
        d="M16.7864 9.98438C15.8833 9.98438 15.0387 10.1733 14.2998 10.5034C15.671 11.6187 16.5364 13.1758 16.5364 14.901C16.5364 15.1011 16.5248 15.2991 16.5026 15.494C16.5725 15.5135 16.6463 15.5234 16.7224 15.5234H21.0818C21.6341 15.5234 22.0818 15.0757 22.0818 14.5234C22.0818 11.9951 19.7117 9.98438 16.7864 9.98438Z"
        fill="currentColor"
        fillOpacity="0.82"
      />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 10V7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="15.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export default function RoomsPage() {
  const session = useRequireSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const i18n = useLocalizedText();

  const { data: props } = useQuery<RoomsData>({
    queryKey: ["rooms-page-data"],
    queryFn: () => fetch("/api/rooms-page-data").then((r) => r.json()),
    enabled: session.status === "authenticated",
  });

  const [passwordModalId, setPasswordModalId] = React.useState<string>();
  const [editRoom, setEditRoom] = React.useState<EditableRoom>();

  const onRoomClick = React.useCallback(
    (id: string, hasPassword?: boolean) => {
      return () => {
        if (hasPassword) {
          setPasswordModalId(id);
        } else
          router.push(`/${id}/${props?.finalsStarted ? "finals" : "groups"}`);
      };
    },
    [props?.finalsStarted, router],
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
              `/${passwordModalId}/${props?.finalsStarted ? "finals" : "groups"}`,
            );
          }
        });
    },
    [passwordModalId, props?.finalsStarted, router],
  );

  const handleEditRoomClose = React.useCallback(() => {
    setEditRoom(undefined);
    void queryClient.invalidateQueries({ queryKey: ["rooms-page-data"] });
  }, [queryClient]);

  if (session.status === "loading" || session.status === "unauthenticated")
    return null;

  return (
    <Layout dark className="relative overflow-hidden before:hidden">
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
        prodeEnd={props?.prodeEnd}
      >
        <div className="shrink-0 [&_div:has(>img)]:!h-[46px] [&_div:has(>img)]:!w-[46px] [&_div:has(>img)_img]:!h-[46px] [&_div:has(>img)_img]:!w-[46px] max-[640px]:[&_div:has(>img)]:!h-[40px] max-[640px]:[&_div:has(>img)]:!w-[40px] max-[640px]:[&_div:has(>img)_img]:!h-[40px] max-[640px]:[&_div:has(>img)_img]:!w-[40px]">
          <HeaderMenu
            compact
            prodePublic={props?.userRanking?.prodePublic}
            dark={props?.userRanking?.dark}
            background={props?.userRanking?.background}
          />
        </div>
      </WelcomeBar>
      <main className={pageContentClass}>
        <div className={ctaRowClass}>
          <Button href="/new-prode" className={ctaButtonClass}>
            {i18n.buttonLabelCreateRoom}
          </Button>
          <span className={dividerClass}>○</span>
        </div>
        <section className={roomsPanelClass} aria-label={i18n.roomsProdeListTitle}>
          <header className={roomsPanelHeaderClass}>
            <h1>{i18n.roomsProdeListTitle}</h1>
          </header>
          <div className={roomsPanelBodyClass}>
            <div className="flex items-start gap-2 !mt-[-12px] max-[640px]:!mt-0 max-[640px]:gap-1.5">
              <div className="shrink-0 w-10 h-10 max-[640px]:w-[22px] max-[640px]:h-[22px] [&_svg]:!h-full [&_svg]:!w-full">
                <InfoIcon />
              </div>
              <p>{i18n.roomsWarning}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-dark-navy text-white text-[20px] [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-bold [&>th]:whitespace-nowrap max-[640px]:text-[14px] max-[640px]:[&>th]:px-2">
                    <th className="text-left rounded-tl-[8px]">
                      {i18n.roomsProdeListColumnName}
                    </th>
                    <th className="text-center w-[120px] max-[640px]:w-[52px]">
                      <span className="max-[640px]:hidden">
                        {i18n.roomsProdeListColumnPlayers}
                      </span>
                      <span
                        className="inline-flex w-full justify-center min-[641px]:hidden [&_svg]:block"
                        aria-label={i18n.roomsProdeListColumnPlayers}
                      >
                        <PlayersIcon />
                      </span>
                    </th>
                    <th className="text-center w-[190px] max-[640px]:w-[88px]">
                      <span className="max-[640px]:hidden">
                        {i18n.roomsProdeListColumnMember}
                      </span>
                      <span className="inline min-[641px]:hidden">
                        {i18n.locale === "es" ? "Miembro?" : "Member?"}
                      </span>
                    </th>
                    <th className="w-[180px] max-[640px]:w-[104px] rounded-tr-[8px]" />
                  </tr>
                </thead>
                <tbody>
                  {(props?.rooms || []).map((row, index) => {
                    const locked = Boolean(row.hasPassword && !row.open);
                    const label = row.alreadyJoin
                      ? i18n.roomsProdeListRedirectLabel
                      : i18n.roomsProdeListJoinLabel;

                    return (
                      <tr
                        key={row.id}
                        data-testid={`room-row-${row.id}`}
                        data-striped={index % 2 === 0}
                        data-locked={locked}
                        className="text-dark-navy data-[striped=true]:bg-[rgba(0,0,0,0.09)] [&>td]:px-4 [&>td]:py-3 max-[640px]:[&>td]:px-2 max-[640px]:[&>td]:py-2.5"
                      >
                        <td className="text-[18px] overflow-hidden text-ellipsis whitespace-nowrap max-[640px]:text-[15px]">
                          {row.name}
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center gap-2 text-[16px] [&_svg]:block max-[640px]:text-[14px]">
                            <span className="max-[640px]:hidden">
                              <PlayersIcon />
                            </span>
                            <span>{row.playerCount}</span>
                          </span>
                        </td>
                        <td className="text-center text-[16px] max-[640px]:text-[14px]">
                          {row.alreadyJoin
                            ? i18n.locale === "es"
                              ? "Sí"
                              : "Yes"
                            : "No"}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-3 max-[640px]:gap-1.5">
                            {locked && (
                              <span className="inline-flex items-center justify-center text-dark-navy">
                                <LockGlyph />
                              </span>
                            )}
                            {row.isCreator && row.room && (
                              <button
                                type="button"
                                className="inline-flex shrink-0 items-center justify-center text-dark-navy border-none p-0 bg-transparent cursor-pointer hover:opacity-75"
                                aria-label={i18n.headerMobileRoomSettings}
                                data-testid={`room-edit-${row.id}`}
                                onClick={() => setEditRoom(row.room)}
                              >
                                <Image
                                  src="/pencil-edit.png"
                                  alt=""
                                  width={22}
                                  height={22}
                                />
                              </button>
                            )}
                            <button
                              type="button"
                              className={enterButtonClass}
                              data-testid={`room-enter-${row.id}`}
                              disabled={locked}
                              onClick={onRoomClick(
                                row.id,
                                row.open ? false : row.hasPassword,
                              )}
                            >
                              {label}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {passwordModalId && <PasswordModal onClose={handlePassword} />}
        {editRoom && (
          <EditRoomModal room={editRoom} onClose={handleEditRoomClose} />
        )}
      </main>
      <Footer>
        <BrandLogo />
        <LocaleSelect />
      </Footer>
    </Layout>
  );
}
