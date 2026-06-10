"use client";

import React from "react";
import { useLocalizedText } from "../../../locale";
import { Button } from "../Button";
import { Modal } from "../Modal";

interface PasswordModalProps {
  className?: string;
  error?: string;
  onClose?: (password: string) => void;
}

export function PasswordModal(
  props: React.PropsWithChildren<PasswordModalProps>,
) {
  const [password, setPassword] = React.useState("");
  const i18n = useLocalizedText();

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setPassword(value);
    },
    [],
  );

  const handleClose = React.useCallback(() => {
    props.onClose?.(password);
  }, [password, props.onClose]);

  return (
    <Modal
      title={i18n.passwordCheckTitle}
      className="flex !min-h-max flex-col place-content-center p-3"
    >
      <input
        placeholder={i18n.passwordCheckLabel}
        className="mb-3 rounded-input border border-neutral-gray bg-transparent p-3 text-dark-navy shadow-none outline-none"
        data-testid="password-modal-input"
        value={password}
        onChange={onChange}
      />
      {props.error ? <div role="alert">{props.error}</div> : null}
      <Button onClick={handleClose} className="border-none">
        {i18n.passwordCheckButtonLabel}
      </Button>
    </Modal>
  );
}
