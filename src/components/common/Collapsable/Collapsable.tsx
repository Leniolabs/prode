import React from "react";
import { className } from "../../../utils/classname";
import { ChevronIcon } from "../Icons";


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
        'coll-collapsable',
        open && 'coll-open',
        props.className
      )}
    >
      <div className={'coll-collapsableTitle'} onClick={handleToggle}>
        {props.title}
        <div>
          <ChevronIcon orientation={open ? "DOWN" : "RIGHT"} />
        </div>
      </div>
      <div className={'coll-collapsableContent'}>{props.children}</div>
    </div>
  );
}
