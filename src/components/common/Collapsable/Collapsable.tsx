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
    <div className={className("collapsable-item", props.className)}>
      <div
        className="cursor-pointer flex text-[18px] font-bold h-[44px] items-center [.collapsable-item+.collapsable-item_&]:border-t [.collapsable-item+.collapsable-item_&]:border-[#1f274050]"
        onClick={handleToggle}
      >
        {props.title}
        <div className="flex ml-auto items-center">
          <ChevronIcon orientation={open ? "DOWN" : "RIGHT"} />
        </div>
      </div>
      {/* Lazy: only mount children once opened. Avoids rendering heavy inputs
          (e.g. dozens of country selects) for collapsed sections — and the
          hidden mobile accordion never mounts on desktop. */}
      {open && <div className="mb-3">{props.children}</div>}
    </div>
  );
}
