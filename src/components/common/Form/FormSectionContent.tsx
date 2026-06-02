import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionContentProps {
  className?: string;
}

export function FormSectionContent(props: React.PropsWithChildren<FormSectionContentProps>) {
  return (
    <div className={className("p-3 px-6 w-full", props.className)}>
      {props.children}
    </div>
  );
}
