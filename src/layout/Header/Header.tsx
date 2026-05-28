import React from "react";
import { className } from "@/utils/classname";
import styles from "./Header.module.scss";

interface HeaderProps {
  className?: string;
}

export function Header(props: React.PropsWithChildren<HeaderProps>) {
  return (
    <header className={className(props.className, styles.header)}>
      {props.children}
    </header>
  );
}
