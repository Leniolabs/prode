import React from "react";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { ShareIcon } from "../Icons";

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
      className={className("lg:hidden ml-auto")}
      onClick={handleShare}
    >
      <ShareIcon />
    </ButtonIcon>
  );
}
