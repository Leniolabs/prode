import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormFooterProps {
  className?: string;
}

export function FormFooter(props: React.PropsWithChildren<FormFooterProps>) {
  return (
    <div className={className(props.className, styles.formFooter)}>
      {props.children}
    </div>
  );
}
