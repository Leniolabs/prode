import React from "react";
import { className } from "../../../utils/classname";
import bracketStyles from "./Finals.module.scss";

interface BracketTitleProps {
  className?: string;
  full?: boolean;
  order: number;
}

export function BracketTitle(
  props: React.PropsWithChildren<BracketTitleProps>
) {
  return (
    <section
      className={className(
        props.className,
        bracketStyles.bracketTitle,
        props.full && bracketStyles.full
      )}
      style={{ order: props.order }}
    >
      {props.children}
    </section>
  );
}
