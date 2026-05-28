import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Groups.module.scss";

interface GroupsContainerProps {
  className?: string;
  full?: boolean;
  admin?: boolean;
}

export function GroupsContainer(
  props: React.PropsWithChildren<GroupsContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        styles.groupsContainer,
        props.full && styles.full,
        props.admin && styles.admin,
      )}
    >
      {props.children}
    </section>
  );
}
