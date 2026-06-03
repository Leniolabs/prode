import React from "react";
import Link from "next/link";
import { className } from "../../../utils/classname";
import styles from "./Button.module.scss";

interface ButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "transparent" | "danger";
  invert?: boolean;
}

export function Button(props: React.PropsWithChildren<ButtonProps>) {
  if (props.href) {
    if (props.disabled)
      return (
        <a
          className={className(
            styles.button,
            props.className,
            props.disabled && styles.disabled,
            props.variant && styles[props.variant],
            props.invert && styles.invert
          )}
        >
          {props.children}
        </a>
      );

    return (
      <Link
        href={props.href}
        className={className(
          styles.button,
          props.className,
          props.disabled && styles.disabled,
          props.variant && styles[props.variant],
          props.invert && styles.invert
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      className={className(
        styles.button,
        props.className,
        props.disabled && styles.disabled,
        props.variant && styles[props.variant],
        props.invert && styles.invert
      )}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
