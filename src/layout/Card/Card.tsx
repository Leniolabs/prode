import React from "react";
import { className } from "@/utils/classname";
import styles from "./Card.module.scss";

interface CardProps {
  className?: string;
  title?: React.ReactNode;
  gridArea?: string;
}

export function Card(props: React.PropsWithChildren<CardProps>) {
  return (
    <section
      className={className(props.className, styles.card)}
      style={{ gridArea: props.gridArea }}
    >
      {props.title && <div className={styles.cardTitle}>{props.title}</div>}
      {props.children}
    </section>
  );
}
