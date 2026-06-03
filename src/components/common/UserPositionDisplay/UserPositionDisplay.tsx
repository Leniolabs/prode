import React from "react";
import { className } from "../../../utils/classname";
import { UserImage } from "../UserImage";
import styles from "./UserPositionDisplay.module.scss";

interface UserPositionDisplayProps {
  className?: string;
  position: number;
}

export function UserPositionDisplay(
  props: React.PropsWithChildren<UserPositionDisplayProps>
) {
  const medalColor = React.useMemo(() => {
    switch (props.position) {
      case 1:
        return "#FFC900";
      case 2:
        return "#D9D9D9";
      case 3:
        return "#D7985E";
      default:
        return "transparent";
    }
  }, [props.position]);

  return (
    <div className={className(props.className, styles.userPositionDisplay)}>
      {medalColor && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" fill={medalColor} />
        </svg>
      )}
      <div className={styles.userPosition}>{props.position}</div>
    </div>
  );
}
