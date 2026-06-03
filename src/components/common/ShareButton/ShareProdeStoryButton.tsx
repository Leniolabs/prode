import axios, { AxiosResponse } from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Button } from "../Button";
import { ButtonIcon } from "../ButtonIcon";
import { ShareIcon } from "../Icons";
import { InstagramReelIcon } from "../Icons/InstagramReelIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import styles from "./ShareButton.module.scss";

interface ShareProdeStoryButtonProps {
  big?: boolean;
  marginLeftAuto?: boolean;
  userProdeId?: string;
}

export function ShareProdeStoryButton(props: ShareProdeStoryButtonProps) {
  const [sharing, setSharing] = React.useState(false);
  const i18n = useLocalizedText();
  const [file, setFile] = React.useState<File | undefined>();
  const videoFetchRef = React.useRef<Promise<void | AxiosResponse<any, any>> | undefined>(undefined);

  const handleInstagramShare = React.useCallback(() => {
    if ("share" in window.navigator) {
      setSharing(true);
      const timezoneOffset = new Date().getTimezoneOffset();
      videoFetchRef.current = axios
        .get(
          `/api/${props.userProdeId}/video?locale=${i18n.locale}&timezone=${timezoneOffset}`,
          {
            responseType: "blob",
          }
        )
        .then((resp) => {
          setFile(
            new File([resp.data], "prode.mp4", {
              type: "video/mp4",
            })
          );
        });
    }
  }, [props.userProdeId, i18n.locale]);

  const handleShare = React.useCallback(() => {
    if (file) {
      const payload = {
        files: [file],
      };
      if (navigator.canShare(payload)) {
        navigator.share({
          ...payload,
        });
        setFile(undefined);
      } else {
        navigator.share({
          ...payload,
          title: document.title,
          url: location.href,
        });
        setFile(undefined);
      }
    } else {
      navigator.share({
        title: document.title,
        url: location.href,
      });
    }
    setSharing(false);
  }, [file]);

  const handleCancel = React.useCallback(() => {
    setFile(undefined);
    setSharing(false);
    
    videoFetchRef.current?.finally(() => {
      setFile(undefined);
    });
  }, []);

  return (
    <ButtonIcon
      className={className(
        styles.mobile,
        styles.marginRightAuto,
        styles.instagramButton
      )}
      // big={props.big}
      onClick={sharing ? undefined : handleInstagramShare}
    >
      <InstagramReelIcon
        loading={sharing}
        className={className(sharing && !file && styles.loading)}
      />
      {sharing && (
        <LoadingOverlay
          onClose={handleCancel}
          loading={!file}
          message={!file ? i18n.generatingVideoLabel : ""}
        >
          {file && (
            <Button onClick={handleShare}>{i18n.buttonLabelShareVideo}</Button>
          )}
        </LoadingOverlay>
      )}
    </ButtonIcon>
  );
}
