import React from "react";
import { className } from "../../../utils/classname";

interface FormSectionTitleProps {
  className?: string;
}

export function FormSectionTitle(props: React.PropsWithChildren<FormSectionTitleProps>) {
  return (
    <div className={className("w-full bg-[#cbd2e9] text-xl text-center flex-[100%] py-[0.2em]", props.className)}>
      {props.children}
    </div>
  );
}
