import React from "react";
import Image from "next/image";
import styles from "./WelcomeBar.module.scss";

interface WelcomeBarProps {
  title: string;
  deadlinePre: string;
  deadlinePost: string;
  prodeEnd?: string | null;
  children?: React.ReactNode;
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
  });
}

export function WelcomeBar({
  title,
  deadlinePre,
  deadlinePost,
  prodeEnd,
  children,
}: WelcomeBarProps) {
  const date = prodeEnd ? formatDeadline(prodeEnd) : "xx de junio";
  return (
    <div className={styles.bar}>
      <Image
        src="/wc2026-trophy.png"
        alt=""
        aria-hidden="true"
        width={115}
        height={289}
        className={styles.trophy}
      />
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>
          {deadlinePre} <span className={styles.highlight}>{date}</span>{" "}
          {deadlinePost}
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
