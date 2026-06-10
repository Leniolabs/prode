import axios, { AxiosResponse, AxiosStatic } from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Button } from "../Button";
import { ButtonIcon } from "../ButtonIcon";
import { InstagramImageIcon } from "../Icons";
import { InstagramReelIcon } from "../Icons/InstagramReelIcon";
import { LoadingOverlay } from "../LoadingOverlay";
import { Modal } from "../Modal";

interface ShareTodayMatchesButtonProps {
  big?: boolean;
  marginLeftAuto?: boolean;
  userProdeId?: string;
}

export function ShareTodayMatchesVideoButton(
  props: ShareTodayMatchesButtonProps
) {
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
          `/api/${props.userProdeId}/story-video?locale=${i18n.locale}&timezone=${timezoneOffset}`,
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
      className="lg:hidden"
      big={props.big}
      onClick={sharing ? undefined : handleInstagramShare}
    >
      <InstagramReelIcon
        loading={sharing}
        className={className(sharing && !file && "[&_circle]:animate-spin [&_circle]:[animation-timing-function:ease-in-out]")}
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
