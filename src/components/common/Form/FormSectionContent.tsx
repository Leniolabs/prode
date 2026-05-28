import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Form.module.scss";

interface FormSectionContentProps {
  className?: string;
}

export function FormSectionContent(props: React.PropsWithChildren<FormSectionContentProps>) {
  return (
    <div className={className(props.className, styles.formSectionContent)}>
      {props.children}
    </div>
  );
}
