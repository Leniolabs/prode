import React from "react";
import { className } from "../../../utils/classname";
import { ChevronIcon } from "../Icons";
import styles from "./Collapsable.module.scss";

interface CollapsableProps {
  className?: string;
  title: string;
}

export function Collapsable(props: React.PropsWithChildren<CollapsableProps>) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    setOpen((o) => !o);
  }, []);

  return (
    <div
      className={className(
        styles.collapsable,
        open && styles.open,
        props.className
      )}
    >
      <div className={styles.collapsableTitle} onClick={handleToggle}>
        {props.title}
        <div>
          <ChevronIcon orientation={open ? "DOWN" : "RIGHT"} />
        </div>
      </div>
      <div className={styles.collapsableContent}>{props.children}</div>
    </div>
  );
}
