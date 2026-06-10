import React from "react";
import { className } from "../../../utils/classname";

interface DailyMatchesProps {
  className?: string;
}

export function DailyMatches(
  props: React.PropsWithChildren<DailyMatchesProps>
) {
  return (
    <div className={className(props.className)}>
      {props.children}
    </div>
  );
}
