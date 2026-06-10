import React from "react";
import { className } from "../../../utils/classname";

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
        "block w-10 h-10 max-w-10 max-h-10 rounded-full p-[3px] flex items-center place-content-center",
        props.onClick && "hover:bg-[#00000033]",
        props.big && "[&>svg]:w-4/5 [&>svg]:h-4/5 w-[60px] h-[60px] max-w-[60px] max-h-[60px]",
        props.className
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
