import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormSectionTitleProps {
  className?: string;
}

export function FormSectionTitle(props: React.PropsWithChildren<FormSectionTitleProps>) {
  return (
    <div className={className(props.className, styles.formSectionTitle)}>
      {props.children}
    </div>
  );
}
