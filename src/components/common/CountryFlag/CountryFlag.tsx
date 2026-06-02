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
        "flex items-center [&_img]:rounded-full [&_img]:m-auto",
        props.tiny && "w-[14px] inline-flex [&_img]:w-[14px]",
        props.disabled && "grayscale opacity-30",
        props.className
      )}
    >
      <img
        src={`/flags/${props.code}.png`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/flags/_placeholder.svg";
        }}
      />
    </div>
  );
}
