import React from "react";
import { className } from "@/utils/classname";

interface ContainerProps {
  className?: string;
  direction?: "COL" | "ROW";
  full?: boolean;
  noPadding?: boolean;
}

export function Container(props: React.PropsWithChildren<ContainerProps>) {
  return (
    <section
      className={className(
        "flex flex-wrap p-0 sm:px-4 sm:py-4 w-[90%] min-w-[80%] mx-auto mt-0 [header+&]:mt-8",
        props.direction === "COL" && "flex-col",
        props.full && "min-w-full w-full",
        props.noPadding && "!p-0",
        props.className
      )}
      style={{
        ["--tw-container-children" as string]: undefined,
      }}
    >
      {props.children}
    </section>
  );
}
