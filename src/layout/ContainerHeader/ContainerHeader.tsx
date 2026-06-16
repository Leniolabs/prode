import React from "react";
import { className } from "@/utils/classname";

interface ContainerHeaderProps {
  className?: string;
  title?: React.ReactNode;
  noMarginTop?: boolean;
  noMarginBottom?: boolean;
  variant?: "PRIMARY" | "SECONDARY";
  sticky?: boolean;

  gridArea?: string;
}

export function ContainerHeader(
  props: React.PropsWithChildren<ContainerHeaderProps>
) {
  const isSecondary = props.variant === "SECONDARY";

  return (
    <div
      className={className(
        "flex w-full mb-4",
        "max-lg:flex-wrap max-lg:-mt-8 max-lg:top-0 max-lg:z-[998]",
        props.sticky && "max-lg:sticky",
        props.noMarginTop && "mt-0",
        props.noMarginBottom && "mb-0",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      <div
        className={className(
          "flex min-w-0 flex-1 items-center font-bold text-xl px-3 py-[7px] text-white",
          isSecondary
            ? "bg-container-header-secondary uppercase"
            : "bg-brand-blue",
          "lg:[&:has(+*:not(:empty))]:mr-4",
          "max-lg:m-0"
        )}
      >
        {props.title}
      </div>
      <div
        className={className(
          "flex shrink-0 [&>*:not(:first-child)]:ml-[5px]",
          "max-lg:ml-auto max-lg:w-full max-lg:[&_button]:w-full"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}
