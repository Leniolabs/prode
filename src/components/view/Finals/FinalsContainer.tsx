import React from "react";
import { className } from "../../../utils/classname";

interface FinalsContainerProps {
  className?: string;
  full?: boolean;
  admin?: boolean;
}

export function FinalsContainer(
  props: React.PropsWithChildren<FinalsContainerProps>
) {
  // The named-area grid (incl. the 1300px breakpoint) lives in the
  // `finals-grid` / `finals-grid-admin` utilities in globals.css.
  return (
    <section
      className={className(
        props.className,
        props.admin ? "finals-grid-admin" : "finals-grid"
      )}
    >
      {props.children}
    </section>
  );
}
