import React from "react";
import Image from "next/image";
import styles from "./WelcomeBar.module.scss";

interface WelcomeBarProps {
  title: string;
  deadlinePre?: string;
  deadlinePost?: string;
  prodeEnd?: string | null;
  subtitle?: React.ReactNode;
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
  subtitle,
  children,
}: WelcomeBarProps) {
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
          {subtitle ??
            (prodeEnd ? (
              <>
                {deadlinePre}{" "}
                <span className={styles.highlight}>{formatDeadline(prodeEnd)}</span>{" "}
                {deadlinePost}
              </>
            ) : null)}
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
