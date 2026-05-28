import React from "react";
import { className } from "@/utils/classname";
import styles from "./Card.module.scss";

interface CardFooterProps {
  className?: string;
}

export function CardFooter(props: React.PropsWithChildren<CardFooterProps>) {
  return (
    <div className={className(styles.cardFooter, props.className)}>
      {props.children}
    </div>
  );
}
