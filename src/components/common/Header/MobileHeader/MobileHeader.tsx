import { ProdeRoom, User } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { Header } from "@/layout";
import { EditRoomModal } from "../../../view/EditRoomModal";
import { ButtonIcon } from "../../ButtonIcon";
import { PencilIcon, ToggleIcon } from "../../Icons";
import { HeaderDivider } from "../HeaderDivider";
import { HeaderIndicator } from "../HeaderIndicator";
import { HeaderMenu } from "../HeaderMenu";
import { HeaderMessage } from "../HeaderMessage";
import { LeniBall } from "../LeniBall";
import styles from "./MobileHeader.module.scss";
import { MobileHeaderMenu } from "./MobileHeaderMenu";

interface MobileHeaderProps {
  id?: string;
  name?: string;
  roomAdmin?: boolean;
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
  finalsStarted?: boolean;
  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points?: number;
    ranking?: number;
  };
  create?: boolean;
  list?: boolean;
  groups?: boolean;
  finals?: boolean;
  shareUserProdeId?: string;
}

export function MobileHeader(
  props: React.PropsWithChildren<MobileHeaderProps>
) {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showRoomModal, setShowRoomModal] = React.useState(false);

  const i18n = useLocalizedText();

  const handleToggleModal = React.useCallback(() => {
    setShowRoomModal(true);
    setShowMobileMenu(false);
  }, []);
  const handleRoomModalClose = React.useCallback(() => {
    setShowRoomModal(false);
    window.location.reload();
  }, []);

  const handleToggleShowMobileMenu = React.useCallback(() => {
    setShowMobileMenu(true);
  }, []);

  const handleCloseShowMobileMenu = React.useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  return (
    <Header className={styles.mobileHeader}>
      <div
        className={styles.mobileHeaderMenuToggle}
        onClick={handleToggleShowMobileMenu}
      >
        <ToggleIcon />
      </div>
      {showMobileMenu && (
        <MobileHeaderMenu
          id={props.id}
          finalsStarted={props.finalsStarted || false}
          title={i18n.headerTitle}
          subtitle={
            !props.name && (
              <>
                {i18n.headerWelcomeLine1}
                <br />
                <span>{i18n.headerWelcomeLine2}</span>.
              </>
            )
          }
          prodeTitle={
            props.name && (
              <>
                {i18n.headerRoom}
                <span>{props.name}</span>
                {props.room && props.roomAdmin ? (
                  <ButtonIcon onClick={handleToggleModal}>
                    <PencilIcon />
                  </ButtonIcon>
                ) : null}
              </>
            )
          }
          userRanking={props.userRanking}
          onRoomSettingsClick={handleToggleModal}
          onClose={handleCloseShowMobileMenu}
          create={props.create}
          list={props.list}
          groups={props.groups}
          finals={props.finals}
          roomAdmin={props.roomAdmin}
        />
      )}
      <HeaderMenu
        position={props.userRanking?.ranking}
        prodePublic={props.userRanking?.prodePublic}
        dark={props.userRanking?.dark}
        background={props.userRanking?.background}
      />

      {showRoomModal && props.room && (
        <EditRoomModal room={props.room} onClose={handleRoomModalClose} />
      )}
    </Header>
  );
}
