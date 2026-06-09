'use client'
import React from "react";
import Image from "next/image";
import { ProdeRoom, User } from "@/generated/prisma";
import { BrandLogo } from "@/components/common/BrandLogo";
import { WelcomeBar } from "@/components/common/Header/WelcomeBar";
import { Layout, Footer } from "@/layout";
import { useRequireSession } from "@/hooks";
import { Button } from "@/components/common/Button";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PasswordModal } from "@/components/common/PasswordModal";
import { Meta } from "@/components/common/Meta";
import { useLocalizedText } from "@/locale";
import { useQuery } from "@tanstack/react-query";
import styles from "./rooms.module.scss";

interface RoomsData {
  finalsStarted: boolean;
  prodeEnd?: string | null;
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
    <Layout dark className={styles.roomsLayout}>
      <Meta />
      <WelcomeBar
        title={i18n.headerTitle}
        deadlinePre={i18n.headerWelcomeLine1}
        deadlinePost={i18n.headerWelcomeLine2}
        prodeEnd={props?.prodeEnd}
      />
      <main className={styles.pageContent}>
        <div className={styles.ctaRow}>
          <Button href="/new-prode">
            {i18n.buttonLabelCreateRoom}
          </Button>
          <span className={styles.divider}>○</span>
        </div>
        <section className={styles.roomsPanel} aria-label={i18n.roomsProdeListTitle}>
          <header className={styles.roomsPanelHeader}>
            <h1>{i18n.roomsProdeListTitle}</h1>
          </header>
          <div className={styles.roomsPanelBody}>
            {(props?.rooms || []).map((row, index) => {
              const locked = Boolean(row.hasPassword && !row.open);
              const label = row.alreadyJoin
                ? i18n.roomsProdeListRedirectLabel
                : i18n.roomsProdeListJoinLabel;

              return (
                <div
                  key={row.id}
                  className={styles.roomRow}
                  data-testid={`room-row-${row.id}`}
                  data-striped={index % 2 === 0}
                  data-locked={locked}
                >
                  <div className={styles.roomName}>{row.name}</div>
                  <div className={styles.roomPlayers}>
                    <PlayersIcon />
                    <span>{row.playerCount}</span>
                  </div>
                  <div className={styles.roomActions}>
                    {locked && (
                      <span className={styles.lockIcon}>
                        <LockGlyph />
                      </span>
                    )}
                    <span className={styles.editIcon} data-disabled={locked}>
                      <Image
                        src="/pencil-edit.png"
                        alt=""
                        width={22}
                        height={22}
                      />
                    </span>
                    <button
                      type="button"
                      className={styles.enterButton}
                      data-testid={`room-enter-${row.id}`}
                      disabled={locked}
                      onClick={onRoomClick(row.id, row.open ? false : row.hasPassword)}
                    >
                      {label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {passwordModalId && <PasswordModal onClose={handlePassword} />}
      </main>
      <Footer>
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
