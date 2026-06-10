import React from "react";
import { className } from "@/utils/classname";

interface CardFooterProps {
  className?: string;
}

export function CardFooter(props: React.PropsWithChildren<CardFooterProps>) {
  return (
    <div className={className("flex place-content-center p-4", props.className)}>
      {props.children}
    </div>
  );
}
