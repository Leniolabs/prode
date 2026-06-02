import React from "react";
import { className } from "../../../utils/classname";

interface FormProps {
  className?: string;
}

export function Form(props: React.PropsWithChildren<FormProps>) {
  return (
    <div className={className("flex flex-wrap", props.className)}>
      {props.children}
    </div>
  );
}
