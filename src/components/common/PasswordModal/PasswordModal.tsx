import React from "react";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { UserImage } from "../UserImage";
import styles from "./PasswordModal.module.scss";

interface PasswordModalProps {
  className?: string;
  error?: string;
  onClose?: (password: string) => void;
}

export function PasswordModal(
  props: React.PropsWithChildren<PasswordModalProps>
) {
  const [password, setPassword] = React.useState("");
  const i18n = useLocalizedText();

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setPassword(value);
    },
    []
  );

  const handleClose = React.useCallback(() => {
    props.onClose?.(password);
  }, [password, props.onClose]);

  return (
    <Modal title={i18n.passwordCheckTitle} className={styles.passwordModal}>
      <input
        placeholder={i18n.passwordCheckLabel}
        className={styles.password}
        data-testid="password-modal-input"
        value={password}
        onChange={onChange}
      />
      {props.error ? <div role="alert">{props.error}</div> : null}
      <Button onClick={handleClose} className="password-modal-submit" >
        {i18n.passwordCheckButtonLabel}
      </Button>
    </Modal>
  );
}
