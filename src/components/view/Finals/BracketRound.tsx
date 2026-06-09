import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Finals.module.scss";

type BracketRoundSize = "16" | "8" | "4" | "2" | "final";

const sizeClass: Record<BracketRoundSize, string> = {
  "16": styles.round16,
  "8": styles.round8,
  "4": styles.round4,
  "2": styles.round2,
  final: styles.roundFinal,
};

interface BracketRoundProps {
  title: React.ReactNode;
  size: BracketRoundSize;
  finalPair?: boolean;
  className?: string;
}

export function BracketRound(
  props: React.PropsWithChildren<BracketRoundProps>
) {
  return (
    <section
      className={className(
        styles.bracketRound,
        sizeClass[props.size],
        props.className
      )}
    >
      <div className={styles.bracketRoundTitle}>{props.title}</div>
      <div
        className={
          props.finalPair ? styles.bracketRoundFinalPair : styles.bracketRoundMatches
        }
      >
        {props.children}
      </div>
    </section>
  );
}
