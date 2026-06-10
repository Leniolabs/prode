import React from "react";
import { className } from "../../../utils/classname";

interface FormFooterProps {
  className?: string;
}

export function FormFooter(props: React.PropsWithChildren<FormFooterProps>) {
  return (
    <div
      className={className(
        props.className,
        "flex text-right p-4 w-full flex-[100%] items-center place-content-[center_end]"
      )}
    >
      {props.children}
    </div>
  );
}
