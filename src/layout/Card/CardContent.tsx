import React from "react";
import { className } from "@/utils/classname";

interface CardContentProps {
  className?: string;
}

export function CardContent(props: React.PropsWithChildren<CardContentProps>) {
  return (
    <div className={className("overflow-visible flex flex-col", props.className)}>
      {props.children}
    </div>
  );
}
