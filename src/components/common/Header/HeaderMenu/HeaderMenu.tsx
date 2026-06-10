"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import axios from "axios";
import { useSession } from "next-auth/react";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { className } from "../../../../utils/classname";
import { CogIcon } from "../../Icons";
import { UserImage } from "../../UserImage";
import { HeaderModal } from "../HeaderModal";

interface HeaderMenuProps {
  className?: string;
  position?: number | null;
  prodePublic?: boolean;
  dark?: boolean;
  background?: string;
  compact?: boolean;
}

export function HeaderMenu(props: React.PropsWithChildren<HeaderMenuProps>) {
  const session = useSession();
  const i18n = useLocalizedText();
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleOpen = React.useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCancel = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSave = React.useCallback(
    (
      name: string,
      prodePublic: boolean,
      dark: boolean,
      background: string,
      image: string | null
    ) => {
      axios
        .patch("/api/profile", {
          name,
          prodePublic,
          dark,
          background,
          image,
        })
        .then((response) => {
          if (response.status === 200) {
            setModalOpen(false);
            window.location.reload();
          }
        });
    },
    []
  );

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            data-testid="header-menu"
            className={className(
              "relative ml-3 flex cursor-pointer border-0 bg-transparent p-0 focus:outline-none",
              props.className
            )}
          >
            <UserImage
              small={props.compact}
              image={session?.data?.user?.image}
            />
            <CogIcon className="absolute bottom-0 right-0" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-[999999] min-w-[180px] overflow-hidden rounded-card bg-card-body py-1 font-sans text-dark-navy shadow-card focus:outline-none"
          >
            <DropdownMenu.Item
              onSelect={handleOpen}
              className="flex cursor-pointer select-none items-center gap-2 px-4 py-2 text-sm text-dark-navy outline-none data-[highlighted]:bg-section-title-bg"
            >
              <CogIcon className="h-4 w-4" />
              {i18n.profileSettingsLabel}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {modalOpen && (
        <HeaderModal
          image={session?.data?.user?.image}
          name={session.data?.user?.name || ""}
          email={session.data?.user?.email || ""}
          prodePublic={props.prodePublic}
          dark={props.dark}
          background={props.background}
          position={props.position}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
