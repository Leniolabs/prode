import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormErrorProps {
  className?: string;
}

export function FormError(props: React.PropsWithChildren<FormErrorProps>) {
  return (
    <div className={className(props.className, styles.formError)}>
      {props.children}
    </div>
  );
}
