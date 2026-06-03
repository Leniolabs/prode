import React from "react";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";
import { UserImage } from "../UserImage";
import styles from "./Modal.module.scss";

interface ModalProps {
  className?: string;
  title: string;
  onClose?: () => void;
}

export function Modal(props: React.PropsWithChildren<ModalProps>) {
  return (
    <div className={className(styles.modalContainer)}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
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
