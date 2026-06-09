import { signOut } from "next-auth/react";
import React from "react";
import { useLocalizedText } from "../../../../locale";
import { className } from "../../../../utils/classname";
import { Button } from "../../Button";
import { Modal } from "../../Modal";
import { Toggle } from "../../Toggle";
import { UserImage } from "../../UserImage";
import styles from "./HeaderModal.module.scss";

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
      headerClassName={styles.headerModalHeader}
    >
      <div className={styles.headerModalProfile}>
        <UserImage
          editable
          className={styles.headerModalUserImage}
          image={image || props.image}
          onChange={setImage}
        />
        <div className={styles.headerModalInfo}>
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
          <div className={styles.headerModalInfoLine}>
            <label>{i18n.profileMailLabel}</label>
            {props.email}
          </div>
          <div className={styles.headerModalInfoLine}>
            <label>{i18n.profileNameLabel}</label>
            <input
              data-testid="profile-name-input"
              value={name}
              onChange={handleNameChange}
            />
          </div>
        </div>
      </div>
      <div className={styles.headerModalSettings}>
        <div className={styles.headerModalSettingsTitle}>
          {i18n.profileSettingsLabel}
        </div>
        <div className={styles.headerModalSetting}>
          <div className={styles.headerModalSettingText}>
            <label>{i18n.profilePublicLabel}</label>
            <p>Si aparecerá en la lista de Prodes o no</p>
          </div>
          <Toggle
            className={styles.headerModalToggle}
            ariaLabel={i18n.profilePublicLabel}
            value={prodePublic}
            onChange={handleProdePublicChange}
          />
        </div>
      </div>
      <div className={styles.headerModalTitle}>
        <Button
          variant="danger"
          className={styles.headerModalActionButton}
          onClick={handleLogout}
        >
          {i18n.buttonLabelExit}
        </Button>
        <Button className={styles.headerModalActionButton} onClick={handleSave}>
          {i18n.buttonLabelSave}
        </Button>
      </div>
    </Modal>
  );
}
