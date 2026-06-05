import React from "react";
import { className } from "@/utils/classname";
import styles from "./Layout.module.scss";

interface LayoutProps {
  className?: string;
}

export function Layout(props: React.PropsWithChildren<LayoutProps>) {
  return (
    <section className={className(props.className, styles.layout)}>
      {props.children}
    </section>
  );
}
