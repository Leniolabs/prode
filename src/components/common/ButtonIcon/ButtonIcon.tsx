import React from "react";
import { className } from "../../../utils/classname";
import styles from "./ButtonIcon.module.scss";

interface ButtonIconProps {
  className?: string;
  onClick?: () => void;

  big?: boolean;
}

export function ButtonIcon(props: React.PropsWithChildren<ButtonIconProps>) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      props.onClick?.();
    },
    [props.onClick]
  );

  return (
    <div
      className={className(
        styles.buttonIcon,
        props.className,
        props.big && styles.big,
        props.onClick && styles.clickable
      )}
      onClick={handleClick}
      data-share="device facebook twitter linkedin"
      data-share-label="Share on"
      data-share-device="Share using device sharing"
    >
      {props.children}
    </div>
  );
}
