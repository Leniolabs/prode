import React from "react";
import Link from "next/link";
import { className } from "../../../utils/classname";

interface ButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "transparent" | "danger";
  invert?: boolean;
}

const BASE =
  "px-4 py-[5px] text-center font-bold text-xl cursor-pointer select-none w-max flex items-center h-full border border-[#354156]";

function variantCls(
  variant?: ButtonProps["variant"],
  invert?: boolean,
  disabled?: boolean
): string {
  const parts: string[] = [];
  if (disabled) parts.push("opacity-70 cursor-default");
  if (invert) {
    parts.push("bg-transparent");
    if (!variant || variant === "primary") parts.push("border-[#ffca30] text-[#ffca30]");
    else if (variant === "secondary") parts.push("border-[#3b4871] text-[#3b4871]");
    else if (variant === "danger") parts.push("border-[#e02045] text-[#3b4871]");
    else if (variant === "transparent") parts.push("border-transparent text-current");
  } else {
    if (!variant || variant === "primary") parts.push("bg-[#ffca30] text-[#354156]");
    else if (variant === "secondary") parts.push("bg-[#3b4871] text-white");
    else if (variant === "danger")
      parts.push("bg-[#e02045] text-white [&_svg]:stroke-white [&_svg]:mr-[5px]");
    else if (variant === "transparent") parts.push("bg-transparent");
  }
  return parts.join(" ");
}

export function Button(props: React.PropsWithChildren<ButtonProps>) {
  const cls = className(
    BASE,
    "hover:contrast-110",
    variantCls(props.variant, props.invert, props.disabled),
    props.className
  );

  if (props.href) {
    if (props.disabled) return <a className={cls}>{props.children}</a>;
    return (
      <Link href={props.href} legacyBehavior>
        <a className={cls}>{props.children}</a>
      </Link>
    );
  }

  return (
    <button className={cls} onClick={props.onClick} disabled={props.disabled}>
      {props.children}
    </button>
  );
}
