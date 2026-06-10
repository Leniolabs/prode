"use client";

import { User } from "@/generated/prisma";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { Button } from "../../Button";
import { CloseIcon } from "../../Icons";
import { HeaderDivider } from "../HeaderDivider";
import { HeaderIndicator } from "../HeaderIndicator";
import { HeaderMenu } from "../HeaderMenu";
import { HeaderMessage } from "../HeaderMessage";

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

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) props.onClose?.();
    },
    [props.onClose]
  );

  return (
    <Dialog.Root open={props.open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-0 top-0 z-[999] h-screen w-screen bg-brand-blue p-3 font-sans focus:outline-none"
        >
          <Dialog.Title className="sr-only">{i18n.headerTitle}</Dialog.Title>
          <HeaderMessage
            className="pt-0 [&>div:first-child]:text-[20px] [&>div:nth-child(2)]:text-[20px]"
            title={props.title}
            subtitle={props.subtitle}
            prodeTitle={props.prodeTitle}
          />
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 cursor-pointer border-0 bg-transparent p-0"
            >
              <CloseIcon />
            </button>
          </Dialog.Close>
          {props.userRanking &&
            (props.userRanking.points || props.userRanking.points === 0) &&
            (props.userRanking.ranking || props.userRanking.ranking === 0) && (
              <>
                <div className="w-full border border-white/30" />
                <div className="flex place-content-center py-5 [&>:first-child]:ml-1.5 [&>:first-child]:mr-3 [&>:last-child]:mr-auto">
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
                <div className="w-full border border-white/30" />
              </>
            )}
          <div className="mt-3 flex flex-col items-center [&>*]:mb-3 [&>*]:w-full [&>*]:justify-center">
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
                  <Button
                    invert
                    onClick={handlePageChange(`/${props.id}/groups`)}
                  >
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
                  <Button
                    invert
                    onClick={handlePageChange(`/${props.id}/ranking`)}
                  >
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
