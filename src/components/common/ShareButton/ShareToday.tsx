import axios from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { ShareIcon } from "../Icons";
import { InstagramReelIcon } from "../Icons/InstagramReelIcon";

import { ShareTodayMatchesVideoButton } from "./ShareTodayMatchesVideoButton";
import { ShareTodayMatchesImageButton } from "./ShareTodayMatchesImageButton";

interface ShareTodayProps {
  userProdeId?: string;
}

export function ShareToday(props: ShareTodayProps) {
  return (
    <div className={'sb-shareToday'}>
      <ShareTodayMatchesImageButton userProdeId={props.userProdeId} />
      <ShareTodayMatchesVideoButton userProdeId={props.userProdeId} />
    </div>
  );
}
