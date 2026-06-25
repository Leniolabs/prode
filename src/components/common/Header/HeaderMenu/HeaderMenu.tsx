"use client";

import axios from "axios";
import { useSession } from "next-auth/react";
import React from "react";
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
      <button
        type="button"
        data-testid="header-menu"
        onClick={handleOpen}
        className={className(
          "relative ml-3 flex cursor-pointer border-0 bg-transparent p-0 focus:outline-none",
          props.className
        )}
      >
        <span className="relative inline-flex overflow-visible p-0.5">
          <span className="rounded-full bg-white p-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            <UserImage
              small={props.compact}
              image={session?.data?.user?.image}
              className="bg-brand-blue"
            />
          </span>
          <span
            className="absolute z-10 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, .4)",
              borderRadius: "100%",
              padding: "3px",
              bottom: "-6px",
              right: "-6px",
            }}
          >
            <CogIcon className="block h-[22px] w-[22px] text-white" />
          </span>
        </span>
      </button>
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
