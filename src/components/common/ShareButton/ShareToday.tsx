"use client";

import React from "react";
import { useCanShareFiles } from "@/hooks";
import styles from "./ShareButton.module.scss";
import { ShareTodayMatchesVideoButton } from "./ShareTodayMatchesVideoButton";
import { ShareTodayMatchesImageButton } from "./ShareTodayMatchesImageButton";

interface ShareTodayProps {
  userProdeId?: string;
}

export function ShareToday(props: ShareTodayProps) {
  const canShareFiles = useCanShareFiles();

  // The story image/video buttons rely on the Web Share API with a file
  // payload, which is unavailable on desktop browsers. Hide them there.
  if (!canShareFiles) return null;

  return (
    <div className={styles.shareToday}>
      <ShareTodayMatchesImageButton userProdeId={props.userProdeId} />
      <ShareTodayMatchesVideoButton userProdeId={props.userProdeId} />
    </div>
  );
}
