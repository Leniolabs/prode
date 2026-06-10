import React from "react";

interface CollapsableContainerProps {}

export function CollapsableContainer(
  props: React.PropsWithChildren<CollapsableContainerProps>
) {
  return (
    <div>
      {props.children}
    </div>
  );
}
