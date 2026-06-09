import React from "react";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";
import styles from "./Modal.module.scss";

interface ModalProps {
  className?: string;
  headerClassName?: string;
  title: string;
  onClose?: () => void;
}

export function Modal(props: React.PropsWithChildren<ModalProps>) {
  const titleId = React.useId();
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, []);

  React.useEffect(() => {
    if (!props.onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose!();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [props.onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={className(styles.modalContainer)}
    >
      <div className={styles.modal} ref={modalRef}>
        <div
          id={titleId}
          className={className(styles.modalHeader, props.headerClassName)}
        >
          {props.title}
          {props.onClose && (
            <div className={styles.modalClose}>
              <ButtonIcon onClick={props.onClose}>
                <CloseIcon />
              </ButtonIcon>
            </div>
          )}
        </div>
        <div className={className(styles.modalContent, props.className)}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
