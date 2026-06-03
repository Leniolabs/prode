import React from "react";
import { className } from "../../../utils/classname";
import { ChevronIcon } from "../Icons";
import styles from "./Collapsable.module.scss";

interface CollapsableContainerProps {}

export function CollapsableContainer(
  props: React.PropsWithChildren<CollapsableContainerProps>
) {
  return (
    <div className={className(styles.collapsableContainer)}>
      {props.children}
    </div>
  );
}
