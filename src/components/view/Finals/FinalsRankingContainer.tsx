import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Finals.module.scss";

interface FinalsRankingContainerProps {
  className?: string;
}

export function FinalsRankingContainer(
  props: React.PropsWithChildren<FinalsRankingContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        styles.finalsRankingContainer
      )}
    >
      {props.children}
    </section>
  );
}
