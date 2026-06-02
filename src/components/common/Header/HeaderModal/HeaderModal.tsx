import { signOut } from "next-auth/react";

import React from "react";
import { useLocalizedText } from "../../../../locale";
import { Button } from "../../Button";
import { Modal } from "../../Modal";
import { Toggle } from "../../Toggle";
import { UserImage } from "../../UserImage";

interface HeaderModalProps {
  className?: string;
  image?: string | null;
  email: string;
  position?: number | null;
  name: string;
  prodePublic?: boolean;
  dark?: boolean;
  background?: string;
  onCancel?: () => void;
  onSave?: (
    name: string,
    prodePublic: boolean,
    dark: boolean,
    background: string,
    image: string | null
  ) => void;
}

export function HeaderModal(props: React.PropsWithChildren<HeaderModalProps>) {
  const [name, setName] = React.useState(props.name);
  const [prodePublic, setprodePublic] = React.useState<boolean>(
    props.prodePublic || false
  );
  const [dark, setDark] = React.useState<boolean>(props.dark || false);
  const [background, setBackground] = React.useState(
    props.background || "background-1"
  );
  const [image, setImage] = React.useState(props.image || null);
  const i18n = useLocalizedText();

  const medalColor = React.useMemo(() => {
    switch (props.position) {
      case 1:
        return "#FFC900";
      case 2:
        return "#D9D9D9";
      case 3:
        return "#D7985E";
      default:
        return "transparent";
    }
  }, [props.position]);

  const handleNameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  const handleBackgroundChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setBackground(e.target.value);
    },
    []
  );

  const handleDarkChange = React.useCallback((checked: boolean) => {
    setDark(checked);
  }, []);

  const handleProdePublicChange = React.useCallback((checked: boolean) => {
    setprodePublic(checked);
  }, []);

  const handleSave = React.useCallback(() => {
    props.onSave?.(name, prodePublic, dark, background, image);
  }, [props.onSave, name, prodePublic, dark, background, image]);

  const handleLogout = React.useCallback(() => {
    signOut();
  }, []);

  return (
    <Modal title={i18n.profileTitle} onClose={props.onCancel}>
      <div className="flex p-6 bg-[#edededcc]">
        <UserImage
          editable
          className="[&_img]:border-2 [&_img]:border-white"
          image={image || props.image}
          onChange={setImage}
        />
        <div className="ml-3 text-lg font-normal flex flex-col overflow-hidden [&>div]:whitespace-nowrap [&>div]:max-w-full [&>div]:flex [&>div]:items-center [&_svg]:mr-1.5 [&_label]:text-[#1f2740] [&_label]:font-bold [&_label]:mr-1.5">
          {props.position && (
            <div>
              <label>{i18n.profilePositionLabel}</label>
              {medalColor && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="8" cy="8" r="8" fill={medalColor} />
                </svg>
              )}
              {props.position}
            </div>
          )}
          <div className="flex flex-wrap relative">
            <label>{i18n.profileMailLabel}</label>
            {props.email}
          </div>
          <div className="flex flex-wrap relative">
            <label>{i18n.profileNameLabel}</label>
            <input
              className="text-base bg-white w-full text-[#1f2740] outline-none shadow-none border border-[#1f2740] max-w-full"
              value={name}
              onChange={handleNameChange}
            />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="text-2xl font-bold mb-6">
          {i18n.profileSettingsLabel}
        </div>
        <div className="flex w-full mb-3 [&_label]:text-lg [&_label]:font-bold [&_label]:mr-auto [&_input]:h-6 [&_input]:w-6 [&_input]:m-0 [&_select]:w-1/2 [&_select]:ml-auto [&_select]:bg-transparent [&_select]:text-[#1f2740]">
          <label>{i18n.profilePublicLabel}</label>
          <Toggle value={prodePublic} onChange={handleProdePublicChange} />
        </div>
        <div className="flex w-full mb-3 [&_label]:text-lg [&_label]:font-bold [&_label]:mr-auto">
          <label>{i18n.profileDarkModeLabel}</label>
          <Toggle value={dark} onChange={handleDarkChange} />
        </div>
        <div className="flex w-full mb-3 [&_label]:text-lg [&_label]:font-bold [&_label]:mr-auto [&_select]:w-1/2 [&_select]:ml-auto [&_select]:bg-transparent [&_select]:text-[#1f2740]">
          <label>{i18n.profileBackgroundLabel}</label>
          <select value={background} onChange={handleBackgroundChange}>
            <option value="background-1">Default</option>
            <option value="background-2">Field</option>
            <option value="background-3">Qatar</option>
          </select>
        </div>
      </div>
      <div className="flex p-6 pt-0 justify-between">
        <Button variant="danger" onClick={handleLogout}>
          {i18n.buttonLabelExit}
        </Button>
        <Button onClick={handleSave}>{i18n.buttonLabelSave}</Button>
      </div>
    </Modal>
  );
}
