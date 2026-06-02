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
  return (
    <section
      className={className(
        "grid flex-wrap w-full gap-x-3",
        "grid-cols-1 grid-rows-[max-content_max-content_max-content_max-content]",
        "[grid-template-areas:'matches-header'_'following'_'matches'_'ranking']",
        "min-[1300px]:mr-3 min-[1300px]:grid-cols-[70%_1fr]",
        "min-[1300px]:[grid-template-areas:'matches-header_following'_'matches_following'_'matches_ranking'_'matches_-']",
        props.full && "w-full",
        props.admin && "w-full !grid-cols-1 ![grid-template-areas:'matches-header'_'matches']",
        props.className
      )}
    >
      {props.children}
    </section>
  );
}
