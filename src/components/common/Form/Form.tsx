import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormProps {
  className?: string;
}

export function Form(props: React.PropsWithChildren<FormProps>) {
  return (
    <div className={className(props.className, styles.form)}>
      {props.children}
    </div>
  );
}
