import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionContentProps {
  className?: string;
}

export function FormSectionContent(
  props: React.PropsWithChildren<FormSectionContentProps>
) {
  return (
    <div className={className(props.className, "p-[12px_16px] w-full")}>
      {props.children}
    </div>
  );
}
