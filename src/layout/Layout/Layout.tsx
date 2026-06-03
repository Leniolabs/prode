import React from "react";
import { className } from "@/utils/classname";
import styles from "./Layout.module.scss";

interface LayoutProps {
  className?: string;
  backgroundImage?: string;
}

export function Layout(props: React.PropsWithChildren<LayoutProps>) {
  return (
    <section
      className={className(props.className, styles.layout)}
      style={
        props.backgroundImage
          ? { backgroundImage: `url(${props.backgroundImage})` }
          : undefined
      }
    >
      {props.children}
    </section>
  );
}
