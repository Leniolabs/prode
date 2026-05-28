import React from "react";
import { className } from "../../../utils/classname";
import { UserImage } from "../UserImage";
import styles from "./UserRankingDisplay.module.scss";

interface UserRankingDisplayProps {
  className?: string;
  image?: string | null;
  name: string;
}

export function UserRankingDisplay(
  props: React.PropsWithChildren<UserRankingDisplayProps>
) {
  return (
    <div className={className(props.className, styles.userRankingDisplay)}>
      <UserImage small image={props.image} />
      <label className={styles.userName}>{props.name}</label>
    </div>
  );
}
