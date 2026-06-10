import React from "react";
import { className } from "../../../utils/classname";

interface CountryFlagProps {
  className?: string;
  code?: string;
  tiny?: boolean;
  disabled?: boolean;
}

export function CountryFlag(props: React.PropsWithChildren<CountryFlagProps>) {
  return (
    <div
      className={className(
        "flex items-center flex-shrink-0",
        props.tiny ? "w-[20px] h-[14px] inline-flex" : "w-[28px] h-[20px]",
        props.disabled && "grayscale opacity-30",
        props.className
      )}
    >
      <img
        src={`/flags/${props.code}.svg`}
        className={className(
          "object-cover rounded-[2px] mx-auto block",
          props.tiny ? "w-[20px] h-[14px]" : "w-[28px] h-[20px]"
        )}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/flags/_placeholder.svg";
        }}
      />
    </div>
  );
}
