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
        "flex w-10 h-10 max-w-10 max-h-10 rounded-full p-[3px] items-center justify-center cursor-pointer",
        props.onClick && "hover:bg-[#00000033]",
        props.big && "!w-[60px] !h-[60px] !max-w-[60px] !max-h-[60px] [&_svg]:w-[80%] [&_svg]:h-[80%]",
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
