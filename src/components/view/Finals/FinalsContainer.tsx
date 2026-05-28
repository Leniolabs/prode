import React from "react";
import { className } from "../../../utils/classname";
import bracketStyles from "./Finals.module.scss";

interface FinalsContainerProps {
  className?: string;
  full?: boolean;
  admin?: boolean;
}

export function FinalsContainer(
  props: React.PropsWithChildren<FinalsContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        bracketStyles.finalsContainer,
        props.full && bracketStyles.full,
        props.admin && bracketStyles.admin
      )}
    >
      {props.children}
    </section>
  );
}

export { bracketStyles };
