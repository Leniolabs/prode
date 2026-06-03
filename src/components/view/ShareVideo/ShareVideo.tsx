import axios from "axios";
import React from "react";
import { Button } from "../../common/Button";

interface ShareVideoProps {
  roomId?: string;
  userId: string;
}

export function ShareVideo(props: ShareVideoProps) {
  const onShare = React.useCallback(() => {
    const video = axios
      .get(`/api/${props.roomId}/user/${props.userId}/video`, {
        responseType: "blob",
      })
      .then((resp) => {
        const payload = {
          files: [new File([resp.data], "prode.mp4", { type: "video/mp4" })],
        };
        if (navigator.canShare(payload)) navigator.share(payload);
      });
  }, []);

  return <Button>Compartir video</Button>;
}
