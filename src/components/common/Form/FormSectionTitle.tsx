import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionTitleProps {
  className?: string;
}

export function FormSectionTitle(
  props: React.PropsWithChildren<FormSectionTitleProps>
) {
  return (
    <div
      className={className(
        props.className,
        "w-full flex-[100%] bg-section-title-bg text-[20px] text-center py-[0.2em]"
      )}
    >
      {props.children}
    </div>
  );
}
