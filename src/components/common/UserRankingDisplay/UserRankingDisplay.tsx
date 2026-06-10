import React from "react";
import { className } from "../../../utils/classname";
import { UserImage } from "../UserImage";

interface UserRankingDisplayProps {
  className?: string;
  image?: string | null;
  name: string;
}

export function UserRankingDisplay(
  props: React.PropsWithChildren<UserRankingDisplayProps>
) {
  return (
    <div className={className("flex items-center min-w-0 overflow-hidden", props.className)}>
      <UserImage small image={props.image} />
      <label className="flex-1 min-w-0 font-normal text-[20px] ml-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
        {props.name}
      </label>
    </div>
  );
}
