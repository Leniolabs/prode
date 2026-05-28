import React from "react";
import { className } from "../../../../utils/classname";
import styles from "./HeaderMessage.module.scss";

interface HeaderMessageProps {
  className?: string;

  title: React.ReactNode;
  subtitle?: React.ReactNode;

  prodeTitle?: React.ReactNode;
}

export function HeaderMessage(
  props: React.PropsWithChildren<HeaderMessageProps>
) {
  return (
    <div className={className(props.className, styles.headerMessage)}>
      <div className={styles.headerMessageTitle}>{props.title} </div>
      {props.subtitle && (
        <div className={styles.headerMessageSubtitle}>{props.subtitle}</div>
      )}
      {props.prodeTitle && (
        <div className={styles.headerMessageTitleHighlighted}>
          {props.prodeTitle}
        </div>
      )}
    </div>
  );
}
