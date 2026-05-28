import React from "react";
import { className } from "@/utils/classname";
import styles from "./Card.module.scss";

interface CardContentProps {
  className?: string;
}

export function CardContent(props: React.PropsWithChildren<CardContentProps>) {
  return (
    <div className={className(styles.cardContent, props.className)}>
      {props.children}
    </div>
  );
}
