import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionProps {
  className?: string;
}

export function FormSection(props: React.PropsWithChildren<FormSectionProps>) {
  return (
    <div className={className("flex-[50%] w-1/2 flex flex-wrap content-start max-lg:flex-[100%] max-lg:w-full", props.className)}>
      {props.children}
    </div>
  );
}
