import React from "react";
import { className } from "../../../utils/classname";

interface GroupsRankingContainerProps {
  className?: string;
}

export function GroupsRankingContainer(
  props: React.PropsWithChildren<GroupsRankingContainerProps>
) {
  return (
    <section
      className={className(
        props.className,
        "w-full min-w-0 max-w-full",
        "[&>section>div:nth-child(2)]:flex [&>section>div:nth-child(2)]:flex-col",
        "[&_a]:max-w-max [&_a]:mx-auto [&_a]:my-6"
      )}
    >
      {props.children}
    </section>
  );
}
