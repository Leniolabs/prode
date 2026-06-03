import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormSectionProps {
  className?: string;
}

export function FormSection(props: React.PropsWithChildren<FormSectionProps>) {
  return (
    <div className={className(props.className, styles.formSection)}>
      {props.children}
    </div>
  );
}
