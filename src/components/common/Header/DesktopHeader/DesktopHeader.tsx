import { ProdeRoom, User } from '@/generated/prisma';
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { Header } from "@/layout";
import { EditRoomModal } from "../../../view/EditRoomModal";
import { ButtonIcon } from "../../ButtonIcon";
import { PencilIcon } from "../../Icons";
import { PageLogo } from "../../PageLogo";
import { HeaderDivider } from "../HeaderDivider";
import { HeaderIndicator } from "../HeaderIndicator";
import { HeaderMenu } from "../HeaderMenu";
import { HeaderMessage } from "../HeaderMessage";
import { LeniBall } from "../LeniBall";

interface DesktopHeaderProps {
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

function formatProdeEnd(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DesktopHeader(
  props: React.PropsWithChildren<DesktopHeaderProps>
) {
  const [showRoomModal, setShowRoomModal] = React.useState(false);

  const i18n = useLocalizedText();

  const handleToggleModal = React.useCallback(() => {
    setShowRoomModal(true);
  }, []);
  const handleRoomModalClose = React.useCallback(() => {
    setShowRoomModal(false);
    window.location.reload();
  }, []);

  const welcomeSubtitle = !props.name && (
    props.prodeEnd ? (
      <>
        {i18n.headerWelcomeLine1}{' '}
        <span>{formatProdeEnd(props.prodeEnd)}</span>{' '}
        {i18n.headerWelcomeLine2}
      </>
    ) : (
      <>
        {i18n.headerWelcomeLine1}
        <br />
        <span>{i18n.headerWelcomeLine2}</span>.
      </>
    )
  );

  return (
    <Header className="max-lg:!hidden [&_a+a]:ml-1.5">
      <PageLogo />
      <HeaderMessage
        title={i18n.headerTitle}
        subtitle={welcomeSubtitle || undefined}
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
      />
      {showRoomModal && props.room && (
        <EditRoomModal room={props.room} onClose={handleRoomModalClose} />
      )}
      {props.children}
      <LeniBall />
      {props.userRanking &&
        (props.userRanking.points || props.userRanking.points === 0) &&
        (props.userRanking.ranking || props.userRanking.ranking === 0) && (
          <>
            <HeaderIndicator
              value={props.userRanking.points}
              text={i18n.headerPointsLabel}
            />
            <HeaderDivider />
            <HeaderIndicator
              value={props.userRanking.ranking}
              text={i18n.headerRankingLabel}
            />
          </>
        )}
      <HeaderMenu
        position={props.userRanking?.ranking}
        prodePublic={props.userRanking?.prodePublic}
        dark={props.userRanking?.dark}
        background={props.userRanking?.background}
      />
    </Header>
  );
}
