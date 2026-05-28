import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Groups.module.scss";

interface CardsContainerProps {
  className?: string;
  gridArea?: string;
}

export function CardsContainer(
  props: React.PropsWithChildren<CardsContainerProps>
) {
  return (
    <section
      className={className(styles.cardsContainer, props.className)}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
