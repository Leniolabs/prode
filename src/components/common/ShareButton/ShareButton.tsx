import axios from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { ShareIcon } from "../Icons";
import { InstagramReelIcon } from "../Icons/InstagramReelIcon";
import styles from "./ShareButton.module.scss";

interface ShareButtonProps {
  big?: boolean;
  marginLeftAuto?: boolean;
  userProdeId?: string;
}

export function ShareButton(props: ShareButtonProps) {
  const handleShare = React.useCallback(() => {
    if ("share" in window.navigator) {
      const payload = {
        title: document.title,
        url: location.href,
      };
      if (navigator.canShare(payload)) {
        navigator.share(payload);
      }
    }
  }, [props.userProdeId]);

  return (
    <ButtonIcon
      big={props.big}
      className={className(styles.mobile, styles.marginLeftAuto)}
      onClick={handleShare}
    >
      <ShareIcon />
    </ButtonIcon>
  );
}
