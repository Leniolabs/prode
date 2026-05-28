import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Finals.module.scss";

interface BracketsMobileContainerProps {
  className?: string;
  gridArea?: string;
}

export function BracketsMobileContainer(
  props: React.PropsWithChildren<BracketsMobileContainerProps>
) {
  return (
    <section
      className={className(props.className, styles.bracketsMobileContainer)}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
