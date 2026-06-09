import { ProdeRoom, User } from "@/generated/prisma";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { EditRoomModal } from "../../../view/EditRoomModal";
import { ButtonIcon } from "../../ButtonIcon";
import { PencilIcon } from "../../Icons";
import { HeaderDivider } from "../HeaderDivider";
import { HeaderIndicator } from "../HeaderIndicator";
import { HeaderMenu } from "../HeaderMenu";
import { WelcomeBar } from "../WelcomeBar";
import styles from "./RoomWelcomeBar.module.scss";

interface RoomWelcomeBarProps {
  id?: string;
  name?: string;
  roomAdmin?: boolean;
  prodeEnd?: string | null;
  room?: Pick<
    ProdeRoom,
    | "id"
    | "name"
    | "emailDomain"
    | "password"
    | "pointsGoals"
    | "pointsPenal"
    | "pointsWinner"
    | "public"
  >;
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points?: number;
    ranking?: number;
  };
}

export function RoomWelcomeBar(
  props: React.PropsWithChildren<RoomWelcomeBarProps>
) {
  const i18n = useLocalizedText();
  const [showRoomModal, setShowRoomModal] = React.useState(false);

  const handleToggleModal = React.useCallback(() => {
    setShowRoomModal(true);
  }, []);
  const handleRoomModalClose = React.useCallback(() => {
    setShowRoomModal(false);
    window.location.reload();
  }, []);

  const hasIndicators =
    props.userRanking &&
    (props.userRanking.points || props.userRanking.points === 0) &&
    (props.userRanking.ranking || props.userRanking.ranking === 0);

  // Room pages always show the room name (or nothing). The deadline subtitle
  // from WelcomeBar is a /rooms concept and must never appear here, so we pass
  // an explicit subtitle (an empty fragment when there is no room name).
  const subtitle = props.name ? (
    <span className={styles.roomName}>
      {i18n.headerRoom}
      <span>{props.name}</span>
      {props.room && props.roomAdmin ? (
        <ButtonIcon onClick={handleToggleModal}>
          <PencilIcon />
        </ButtonIcon>
      ) : null}
    </span>
  ) : (
    <></>
  );

  return (
    <>
      <WelcomeBar title={i18n.headerTitle} subtitle={subtitle}>
        <div className={styles.controls}>
          {props.children}
          {hasIndicators && (
            <>
              <HeaderIndicator
                compact
                value={props.userRanking?.points}
                text={i18n.headerPointsLabel}
              />
              <HeaderDivider compact />
              <HeaderIndicator
                compact
                value={props.userRanking?.ranking}
                text={i18n.headerRankingLabel}
              />
            </>
          )}
          <HeaderMenu
            compact
            position={props.userRanking?.ranking}
            prodePublic={props.userRanking?.prodePublic}
            dark={props.userRanking?.dark}
            background={props.userRanking?.background}
          />
        </div>
      </WelcomeBar>
      {showRoomModal && props.room && (
        <EditRoomModal room={props.room} onClose={handleRoomModalClose} />
      )}
    </>
  );
}
