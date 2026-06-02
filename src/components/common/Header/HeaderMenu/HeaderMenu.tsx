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
}

export function HeaderMenu(props: React.PropsWithChildren<HeaderMenuProps>) {
  const session = useSession();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handleOpen = React.useCallback(() => {
    if (!modalOpen) setModalOpen(true);
  }, [modalOpen]);

  const handleCancel = React.useCallback(() => {
    if (modalOpen) setModalOpen(false);
  }, [modalOpen]);

  const handleSave = React.useCallback(
    (
      name: string,
      prodePublic: boolean,
      dark: boolean,
      background: string,
      image: string | null
    ) => {
      setSaving(true);
      axios
        .patch("/api/profile", {
          name,
          prodePublic,
          dark,
          background,
          image,
        })
        .then((response) => {
          setSaving(false);
          if (response.status === 200) {
            setModalOpen(false);
            window.location.reload();
          }
        });
    },
    []
  );

  return (
    <div
      className={className("relative ml-3", props.className)}
      onClick={handleOpen}
    >
      <UserImage image={session?.data?.user?.image} />
      <CogIcon className="absolute right-0 bottom-0" />
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
    </div>
  );
}
