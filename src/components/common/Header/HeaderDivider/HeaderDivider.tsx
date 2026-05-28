import React from "react";
import { className } from "../../../../utils/classname";
import styles from "./HeaderDivider.module.scss";

interface HeaderDividerProps {
  className?: string;
}

export function HeaderDivider(
  props: React.PropsWithChildren<HeaderDividerProps>
) {
  return <div className={className(props.className, styles.headerDivider)} />;
}
