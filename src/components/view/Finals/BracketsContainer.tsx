import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Finals.module.scss";

interface BracketsContainerProps {
  className?: string;
  gridArea?: string;
}

export function BracketsContainer(
  props: React.PropsWithChildren<BracketsContainerProps>
) {
  return (
    <section
      className={className(props.className, styles.bracketsContainer)}
      style={{ gridArea: props.gridArea }}
    >
      {props.children}
    </section>
  );
}
