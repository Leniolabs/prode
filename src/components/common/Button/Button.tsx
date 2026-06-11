import React from "react";
import Link from "next/link";
import { className } from "../../../utils/classname";

interface ButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "transparent" | "outline" | "danger";
  invert?: boolean;
}

const baseClasses =
  "inline-flex items-center gap-[10px] px-5 py-[10px] text-center font-bold text-xl cursor-pointer select-none w-max rounded-button h-full border border-dark-navy bg-accent-yellow text-dark-navy transition duration-150 hover:not-disabled:brightness-105 hover:not-disabled:shadow-md active:not-disabled:scale-[0.97]";

function variantClasses(
  variant: ButtonProps["variant"],
  invert: boolean | undefined
): string {
  if (invert) {
    if (variant === "primary")
      return "!bg-transparent border !border-accent-yellow !text-accent-yellow rounded-button px-5 py-[10px] gap-[10px]";
    if (variant === "secondary")
      return "!bg-transparent border !border-brand-blue !text-brand-blue rounded-button px-5 py-[10px] gap-[10px]";
    if (variant === "danger")
      return "!bg-transparent border !border-[#e02045] !text-[#e02045] rounded-button px-5 py-[10px] gap-[10px]";
    // default invert
    return "!bg-transparent border !border-white !text-white rounded-button px-5 py-[10px] gap-[10px] hover:not-disabled:!bg-white/15";
  }

  if (variant === "primary") return "";
  if (variant === "secondary") return "!bg-brand-light-blue !text-white !border-none";
  if (variant === "danger")
    return "!bg-[#e02045] !text-white !border-[#e02045] [&>svg]:stroke-white [&>svg]:mr-[5px]";
  if (variant === "transparent")
    return "!bg-transparent border !border-white !text-white rounded-button px-5 py-[10px] gap-[10px] hover:not-disabled:!bg-white/15";
  if (variant === "outline")
    return "!bg-white !text-brand-light-blue border-[1.5px] !border-brand-light-blue text-xl";
  return "";
}

export function Button(props: React.PropsWithChildren<ButtonProps>) {
  const classes = className(
    baseClasses,
    props.disabled && "opacity-70 cursor-default",
    variantClasses(props.variant, props.invert),
    props.className
  );

  if (props.href) {
    if (props.disabled)
      return <a className={classes}>{props.children}</a>;

    return (
      <Link href={props.href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
