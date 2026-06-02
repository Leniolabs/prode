import React from "react";
import { className } from "../../../utils/classname";

interface ToggleProps {
  className?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle(props: React.PropsWithChildren<ToggleProps>) {
  const handleClick = React.useCallback(() => {
    props.onChange?.(!props.value);
  }, [props.onChange, props.value]);

  return (
    <div
      className={className(
        "flex w-11 h-6 p-0.5 rounded-[15px] cursor-pointer",
        props.value ? "bg-[#69b29a]" : "bg-[#cd5367]",
        props.className
      )}
      onClick={handleClick}
    >
      <div
        className={className(
          "rounded-full w-5 h-5 bg-white transition-transform duration-100 ease-in-out cursor-pointer",
          props.value && "translate-x-full"
        )}
      />
    </div>
  );
}
