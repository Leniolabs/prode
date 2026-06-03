import React from "react";
import { className } from "../../../utils/classname";
import styles from "./HomeTitle.module.scss";

interface HomeTitleProps {
  className?: string;
}

export function HomeTitle(props: React.PropsWithChildren<HomeTitleProps>) {
  return (
    <div className={className(props.className, styles.homeTitle)}>
      {props.children}
    </div>
  );
}
