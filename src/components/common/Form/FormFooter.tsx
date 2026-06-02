import React from "react";
import { className } from "../../../utils/classname";

interface FormFooterProps {
  className?: string;
}

export function FormFooter(props: React.PropsWithChildren<FormFooterProps>) {
  return (
    <div className={className("flex text-right p-6 w-full flex-[100%] items-center justify-end", props.className)}>
      {props.children}
    </div>
  );
}
