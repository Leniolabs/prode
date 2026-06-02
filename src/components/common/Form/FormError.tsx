import React from "react";
import { className } from "../../../utils/classname";

interface FormErrorProps {
  className?: string;
}

export function FormError(props: React.PropsWithChildren<FormErrorProps>) {
  return (
    <div className={className("px-6 py-0 text-right text-red-600", props.className)}>
      {props.children}
    </div>
  );
}
