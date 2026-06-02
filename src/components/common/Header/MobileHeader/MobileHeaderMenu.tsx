import { User } from "@/generated/prisma";
import { useRouter } from "next/navigation";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { Button } from "../../Button";
import { CloseIcon } from "../../Icons";
import { UserImage } from "../../UserImage";
import { HeaderDivider } from "../HeaderDivider";
import { HeaderIndicator } from "../HeaderIndicator";
import { HeaderMenu } from "../HeaderMenu";
import { HeaderMessage } from "../HeaderMessage";
import styles from "./MobileHeader.module.scss";

interface MobileHeaderMenuProps {
  open?: boolean;

  title: React.ReactNode;
  subtitle?: React.ReactNode;

  prodeTitle?: React.ReactNode;

  finalsStarted: boolean;

  id?: string;

  roomAdmin?: boolean;

  create?: boolean;
  list?: boolean;
  groups?: boolean;
  finals?: boolean;

  userRanking?: Pick<
    User,
    "id" | "name" | "image" | "email" | "prodePublic" | "background" | "dark"
  > & {
    points?: number;
    ranking?: number;
  };

  onClose?: () => void;

  onRoomSettingsClick?: () => void;
}

export function MobileHeaderMenu(
  props: React.PropsWithChildren<MobileHeaderMenuProps>
) {
  const router = useRouter();
  const i18n = useLocalizedText();

  const handlePageChange = React.useCallback(
    (url: string) => {
      return () => {
        router.push(url);
        props.onClose?.();
      };
    },
    [props.onClose]
  );

  return (
    <div className={styles.mobileHeaderMenu}>
      <HeaderMessage
        className={styles.mobileHeaderMessage}
        title={props.title}
        subtitle={props.subtitle}
        prodeTitle={props.prodeTitle}
      />
      <div className={styles.closeIcon} onClick={props.onClose}>
        <CloseIcon />
      </div>
      {props.userRanking &&
        (props.userRanking.points || props.userRanking.points === 0) &&
        (props.userRanking.ranking || props.userRanking.ranking === 0) && (
          <>
            <div className={styles.divider} />
            <div className={styles.userRanking}>
              <HeaderMenu
                prodePublic={props.userRanking?.prodePublic}
                dark={props.userRanking?.dark}
                background={props.userRanking?.background}
              />
              <HeaderIndicator
                align="LEFT"
                value={props.userRanking.points}
                text={i18n.headerPointsLabel}
              />
              <HeaderDivider />
              <HeaderIndicator
                align="LEFT"
                value={props.userRanking.ranking}
                text={i18n.headerRankingLabel}
              />
            </div>
            <div className={styles.divider} />
          </>
        )}
      <div className={styles.menuButtons}>
        {props.list && (
          <Button invert href="/rooms">
            {i18n.buttonLabelProdeList}
          </Button>
        )}
        {props.id ? (
          <>
            {props.roomAdmin && (
              <Button onClick={props.onRoomSettingsClick} invert>
                {i18n.headerMobileRoomSettings}
              </Button>
            )}
            {props.groups && (
              <Button invert onClick={handlePageChange(`/${props.id}/groups`)}>
                {i18n.buttonLabelGroupPhase}
              </Button>
            )}
            {props.finals && (
              <Button
                disabled={!props.finalsStarted}
                invert
                onClick={handlePageChange(`/${props.id}/finals`)}
              >
                {i18n.buttonLabelFinalsPhase}
              </Button>
            )}
            {props.groups && (
              <Button invert onClick={handlePageChange(`/${props.id}/ranking`)}>
                {i18n.rankingTitle}
              </Button>
            )}
          </>
        ) : (
          <>
            {props.create && (
              <Button invert href="/new-prode">
                {i18n.buttonLabelCreateRoom}
              </Button>
            )}
            {props.groups && (
              <Button invert onClick={handlePageChange(`/`)}>
                {i18n.buttonLabelGroupPhase}
              </Button>
            )}
            {props.finals && (
              <Button
                disabled={!props.finalsStarted}
                invert
                onClick={handlePageChange(`/finals`)}
              >
                {i18n.buttonLabelFinalsPhase}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
