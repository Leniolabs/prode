import React from "react";
import { className } from "@/utils/classname";
import styles from "./ContainerHeader.module.scss";

interface ContainerHeaderProps {
  className?: string;
  title?: React.ReactNode;
  noMarginTop?: boolean;
  noMarginBottom?: boolean;
  variant?: "PRIMARY" | "SECONDARY";
  sticky?: boolean;

  gridArea?: string;
}

export function ContainerHeader(
  props: React.PropsWithChildren<ContainerHeaderProps>
) {
  return (
    <div
      className={className(
        props.className,
        styles.containerHeader,
        props.noMarginTop && styles.noMarginTop,
        props.noMarginBottom && styles.noMarginBottom,
        props.sticky && styles.sticky,
        props.variant && styles[props.variant]
      )}
      style={{ gridArea: props.gridArea }}
    >
      <div className={styles.title}>{props.title}</div>
      <div>{props.children}</div>
    </div>
  );
}
