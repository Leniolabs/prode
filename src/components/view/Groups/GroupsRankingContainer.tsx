import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Groups.module.scss";

interface GroupsRankingContainerProps {
  className?: string;
}

export function GroupsRankingContainer(
  props: React.PropsWithChildren<GroupsRankingContainerProps>
) {
  return (
    <section
      className={className(props.className, styles.groupsRankingContainer)}
    >
      {props.children}
    </section>
  );
}
