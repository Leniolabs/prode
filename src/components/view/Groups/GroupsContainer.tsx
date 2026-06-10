import React from "react";
import { className } from "../../../utils/classname";

interface GroupsContainerProps {
  className?: string;
  full?: boolean;
  admin?: boolean;
}

export function GroupsContainer(
  props: React.PropsWithChildren<GroupsContainerProps>
) {
  // The named-area grid (incl. the minmax(0, 1fr) overflow fix and the
  // 1300px breakpoint) lives in the `groups-grid` / `groups-grid-admin`
  // utilities in globals.css. Admin renders a single matches column.
  return (
    <section
      className={className(
        props.className,
        props.admin ? "groups-grid-admin" : "groups-grid"
      )}
    >
      {props.children}
    </section>
  );
}
