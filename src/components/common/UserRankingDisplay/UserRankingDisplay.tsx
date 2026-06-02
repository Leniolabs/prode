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
    <div className={className("flex items-center", props.className)}>
      <UserImage small image={props.image} />
      <label className="font-normal text-xl ml-3 text-ellipsis">{props.name}</label>
    </div>
  );
}
