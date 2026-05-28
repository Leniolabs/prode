import React from "react";
import { className } from "../../../../utils/classname";
import styles from "./HeaderIndicator.module.scss";

interface HeaderIndicatorProps {
  className?: string;

  text: React.ReactNode;
  value: React.ReactNode;

  align?: "LEFT" | "RIGHT";
}

export function HeaderIndicator(
  props: React.PropsWithChildren<HeaderIndicatorProps>
) {
  return (
    <div
      className={className(
        props.className,
        styles.headerIndicator,
        props.align && styles[props.align]
      )}
    >
      <div className={styles.headerIndicatorValue}>{props.value}</div>
      <div className={styles.headerIndicatorText}>{props.text}</div>
    </div>
  );
}
