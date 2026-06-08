import React from "react";
import { className } from "@/utils/classname";
import styles from "./Footer.module.scss";

interface FooterProps {
  className?: string;
  dark?: boolean;
}

export function Footer(props: React.PropsWithChildren<FooterProps>) {
  return (
    <section className={className(props.className, styles.footer, props.dark ? styles.dark : undefined)}>
      {props.children}
    </section>
  );
}
