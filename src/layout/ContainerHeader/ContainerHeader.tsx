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
  const titleBase =
    "w-full bg-[#1f2740] text-white flex items-center font-bold text-xl py-[7px] px-3";
  const titleSecondary =
    "bg-[#343f52] text-white uppercase [&_*:has(img)]:mr-1";
  const titleDesktopSibling =
    "lg:[&:has(+*:not(:empty))]:mr-4";

  return (
    <div
      className={className(
        "flex w-full mb-4",
        props.noMarginTop && "mt-0",
        props.noMarginBottom && "mb-0",
        /* mobile layout */
        "max-lg:flex-wrap max-lg:-mt-8 max-lg:top-0 max-lg:z-[998]",
        props.sticky && "max-lg:sticky",
        props.variant === "SECONDARY" && "",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      <div
        className={className(
          titleBase,
          titleDesktopSibling,
          props.variant === "SECONDARY" && titleSecondary,
          /* mobile: title adjacent element fills full width */
          "max-lg:m-0"
        )}
      >
        {props.title}
      </div>
      <div
        className={className(
          "flex [&>*:not(:first-child)]:ml-[5px]",
          "max-lg:ml-auto max-lg:[&_button]:w-full"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}
