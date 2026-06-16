import { signOut } from "next-auth/react";
import React from "react";
import {
  useLocalizedText,
  useLocale,
  useSetLocale,
  SUPPORTED_LOCALES,
} from "../../../../locale";
import { className } from "../../../../utils/classname";
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
    image: string | null,
  ) => void;
}

export function HeaderModal(props: React.PropsWithChildren<HeaderModalProps>) {
  const { background, dark, onSave } = props;
  const [name, setName] = React.useState(props.name);
  const [prodePublic, setprodePublic] = React.useState<boolean>(
    props.prodePublic || false,
  );
  const [image, setImage] = React.useState(props.image || null);
  const i18n = useLocalizedText();
  const currentLocale = useLocale();
  const setLocale = useSetLocale();

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
    [],
  );

  const handleProdePublicChange = React.useCallback((checked: boolean) => {
    setprodePublic(checked);
  }, []);

  const handleSave = React.useCallback(() => {
    onSave?.(
      name,
      prodePublic,
      dark || false,
      background || "background-1",
      image,
    );
  }, [onSave, name, prodePublic, dark, background, image]);

  const handleLogout = React.useCallback(() => {
    // Land on the public login page, not the current protected page.
    // useRequireSession auto-fires signIn("google") on unauthenticated pages,
    // so a default signOut() would bounce the user straight back into Google.
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <Modal
      title={i18n.profileTitle}
      onClose={props.onCancel}
      headerClassName="bg-[#00192c]"
    >
      <div className="bg-[#edededcc] p-6">
        <UserImage
          editable
          className="m-auto [&_img]:border-2 [&_img]:border-solid [&_img]:border-white"
          image={image || props.image}
          onChange={setImage}
        />
        <div className="ml-3 flex min-w-0 flex-1 flex-col gap-0 overflow-hidden text-[18px] font-normal">
          {props.position && (
            <div className="flex min-w-0 flex-col">
              <label className="text-[20px] font-semibold text-dark-navy">
                {i18n.profilePositionLabel}
              </label>
              <div className="mt-1 flex items-center text-[18px] whitespace-nowrap">
                {medalColor && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5"
                  >
                    <circle cx="8" cy="8" r="8" fill={medalColor} />
                  </svg>
                )}
                {props.position}
              </div>
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <label className="text-[20px] font-semibold text-dark-navy">
              {i18n.profileMailLabel}
            </label>
            <div className="mt-1 truncate text-[18px]">{props.email}</div>
          </div>
          <div className="flex min-w-0 flex-col">
            <label className="text-[20px] font-semibold text-dark-navy">
              {i18n.profileNameLabel}
            </label>
            <input
              data-testid="profile-name-input"
              className="mt-1 w-full max-w-full border border-solid border-neutral-gray bg-white px-2 py-1 text-[16px] text-dark-navy shadow-none outline-none"
              value={name}
              onChange={handleNameChange}
            />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6 text-2xl font-bold">
          {i18n.profileSettingsLabel}
        </div>
        <div className="mb-3 flex w-full items-center">
          <div className="mr-auto">
            <label className="block font-sans text-[16px] font-normal leading-[1.2] text-[#00192c]">
              {i18n.profilePublicLabel}
            </label>
            <p className="mb-0 mt-1 font-sans text-[14px] font-normal leading-[1.2] text-[#717171]">
              Si aparecerá en la lista de Prodes o no
            </p>
          </div>
          <Toggle
            className="ml-auto h-6 min-h-6 w-11 min-w-11 flex-[0_0_44px] p-0.5"
            ariaLabel={i18n.profilePublicLabel}
            value={prodePublic}
            onChange={handleProdePublicChange}
          />
        </div>
        <div className="mb-3 flex w-full items-center">
          <div className="mr-auto">
            <label className="block font-sans text-[16px] font-normal leading-[1.2] text-[#00192c]">
              {i18n.profileLanguageLabel}
            </label>
          </div>
          <div className="ml-auto flex select-none items-center">
            {SUPPORTED_LOCALES.map((locale, i, arr) => (
              <React.Fragment key={locale}>
                <a
                  role="button"
                  className={className(
                    "cursor-pointer rounded-sm px-1.5 py-0.5 font-sans text-[14px] font-normal text-dark-navy hover:bg-[rgba(0,25,44,0.08)]",
                    locale === currentLocale
                      ? "bg-[rgba(0,25,44,0.12)] font-semibold"
                      : "",
                  )}
                  onClick={() => setLocale(locale)}
                >
                  {locale.toUpperCase()}
                </a>
                {i < arr.length - 1 && (
                  <span className="px-0.5 text-[14px] text-dark-navy">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between p-6 pt-0">
        <Button
          variant="danger"
          className="!border-none !px-5 !py-2.5 !text-[20px]"
          onClick={handleLogout}
        >
          {i18n.buttonLabelExit}
        </Button>
        <Button
          className="!border-none !px-5 !py-2.5 !text-[20px]"
          onClick={handleSave}
        >
          {i18n.buttonLabelSave}
        </Button>
      </div>
    </Modal>
  );
}
