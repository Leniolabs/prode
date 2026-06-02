import React from "react";
import { className } from "../../../utils/classname";
import { ChevronIcon } from "../Icons";


interface CollapsableContainerProps {}

export function CollapsableContainer(
  props: React.PropsWithChildren<CollapsableContainerProps>
) {
  return (
    <div className={className('coll-collapsableContainer')}>
      {props.children}
    </div>
  );
}
