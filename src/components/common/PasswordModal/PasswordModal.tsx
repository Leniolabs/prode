import React from "react";
import { useLocalizedText } from "../../../locale";
import { Button } from "../Button";
import { Modal } from "../Modal";

interface PasswordModalProps {
  className?: string;
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
    <Modal title={i18n.passwordCheckTitle} className="flex justify-center flex-col p-3 min-h-max">
      <input
        placeholder={i18n.passwordCheckLabel}
        className="p-3 bg-transparent outline-none shadow-none border border-[#1f2740] mb-3 text-[#1f2740]"
        value={password}
        onChange={onChange}
      />
      <Button onClick={handleClose}>{i18n.passwordCheckButtonLabel}</Button>
    </Modal>
  );
}
