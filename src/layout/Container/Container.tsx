import React from "react";
import { className } from "@/utils/classname";
import styles from "./Container.module.scss";

interface ContainerProps {
  className?: string;
  direction?: "COL" | "ROW";
  full?: boolean;
  noPadding?: boolean;
}

export function Container(props: React.PropsWithChildren<ContainerProps>) {
  return (
    <section
      className={className(
        props.className,
        styles.container,
        props.direction === "COL" && styles.directionCol,
        props.full && styles.full,
        props.noPadding && styles.noPadding
      )}
    >
      {props.children}
    </section>
  );
}
