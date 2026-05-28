import React from "react";
import { className } from "../../../utils/classname";
import styles from "./DailyMatches.module.scss";

interface DailyMatchesProps {
  className?: string;
}

export function DailyMatches(
  props: React.PropsWithChildren<DailyMatchesProps>
) {
  return (
    <div className={className(props.className, styles.dailyMatches)}>
      {props.children}
    </div>
  );
}
