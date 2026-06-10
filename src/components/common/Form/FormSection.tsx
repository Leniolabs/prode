import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionProps {
  className?: string;
}

export function FormSection(props: React.PropsWithChildren<FormSectionProps>) {
  return (
    <div
      className={className(
        props.className,
        "flex-[50%] w-1/2 flex flex-wrap content-start max-lg:flex-[100%] max-lg:w-full"
      )}
    >
      {props.children}
    </div>
  );
}
