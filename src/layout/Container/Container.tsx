import React from "react";
import { className } from "@/utils/classname";

interface ContainerProps {
  className?: string;
  direction?: "COL" | "ROW";
  full?: boolean;
  noPadding?: boolean;
  narrow?: boolean;
}

export function Container(props: React.PropsWithChildren<ContainerProps>) {
  return (
    <section
      className={className(
        "flex flex-wrap flex-1 px-3 py-0 min-[600px]:px-4 min-[600px]:py-4 w-[90%] min-w-[80%] mx-auto mt-0 [&>*]:mx-auto",
        props.direction === "COL" && "flex-col",
        props.full && "min-w-full w-full",
        props.noPadding && "!px-0 !py-0",
        props.narrow && "w-full min-w-0 max-w-[560px]",
        props.className
      )}
    >
      {props.children}
    </section>
  );
}
