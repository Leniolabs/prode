import React from "react";
import { className } from "@/utils/classname";
import styles from "./Footer.module.scss";

interface FooterProps {
  className?: string;
}

export function Footer(props: React.PropsWithChildren<FooterProps>) {
  return (
    <section className={className(props.className, styles.footer)}>
      {props.children}
    </section>
  );
}
