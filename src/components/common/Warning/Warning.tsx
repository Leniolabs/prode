import React from "react";
import { className } from "../../../utils/classname";
import { InfoIcon } from "../Icons";

interface WarningProps {
  offset?: boolean;
  className?: string;
}

export function Warning(props: React.PropsWithChildren<WarningProps>) {
  return (
    <div
      className={className(
        "bg-warning-bg text-dark-navy m-0 flex p-3",
        props.className
      )}
    >
      <div className="flex items-center mr-3">
        <InfoIcon />
      </div>
      <div className="[&_a]:text-dark-navy [&_a]:underline">
        {props.children}
      </div>
    </div>
  );
}
