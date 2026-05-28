import axios from "axios";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { InstagramImageIcon } from "../Icons";
import styles from "./ShareButton.module.scss";

interface ShareTodayMatchesButtonProps {
  big?: boolean;
  marginLeftAuto?: boolean;
  userProdeId?: string;
}

export function ShareTodayMatchesImageButton(
  props: ShareTodayMatchesButtonProps
) {
  const [sharing, setSharing] = React.useState(false);
  const { locale } = useLocalizedText();

  const handleInstagramShare = React.useCallback(() => {
    if ("share" in window.navigator) {
      setSharing(true);
      const timezoneOffset = new Date().getTimezoneOffset();
      axios
        .get(
          `/api/${props.userProdeId}/story-image?locale=${locale}&timezone=${timezoneOffset}`,
          {
            responseType: "blob",
          }
        )
        .then((resp) => {
          const payload = {
            files: [
              new File([resp.data], "prode.png", {
                type: "image/png",
              }),
            ],
          };
          if (navigator.canShare(payload)) {
            navigator.share({
              ...payload,
            });
          } else {
            navigator.share({
              ...payload,
              title: document.title,
              url: location.href,
            });
          }
          setSharing(false);
        });
    }
  }, [props.userProdeId, locale]);

  return (
    <ButtonIcon
      className={className(styles.mobile, styles.marginLeftAuto)}
      big={props.big}
      onClick={sharing ? undefined : handleInstagramShare}
    >
      <InstagramImageIcon
        loading={sharing}
        className={className(sharing && styles.loading)}
      />
    </ButtonIcon>
  );
}
