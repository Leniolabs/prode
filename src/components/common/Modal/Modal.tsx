"use client";

import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";

interface ModalProps {
  className?: string;
  headerClassName?: string;
  title: string;
  onClose?: () => void;
}

export function Modal(props: React.PropsWithChildren<ModalProps>) {
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) props.onClose?.();
    },
    [props.onClose],
  );

  // Radix dismiss interactions (Escape, outside-click) only make sense when a
  // close handler exists. When there is no `onClose`, suppress them so the modal
  // stays put — matching the old hand-rolled behavior.
  const preventDismiss = (e: Event) => {
    if (!props.onClose) e.preventDefault();
  };

  return (
    <Dialog.Root open onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[999999] bg-modal-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={preventDismiss}
          onPointerDownOutside={preventDismiss}
          onInteractOutside={preventDismiss}
          className="fixed left-1/2 top-1/2 z-[999999] flex max-h-[100dvh] w-[calc(100vw-32px)] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-card font-sans shadow-card focus:outline-none min-[400px]:w-auto min-[400px]:min-w-[400px]"
        >
          <div
            className={className(
              "relative w-full flex-shrink-0 bg-dark-navy px-3 py-1.5 text-[20px] font-bold text-white",
              props.headerClassName,
            )}
          >
            <Dialog.Title className="m-0 text-[20px] font-bold leading-normal text-white">
              {props.title}
            </Dialog.Title>
            {props.onClose && (
              <div className="absolute right-0 top-0 [&_svg]:h-5 [&_svg]:w-5">
                <ButtonIcon onClick={props.onClose}>
                  <CloseIcon />
                </ButtonIcon>
              </div>
            )}
          </div>
          <div
            className={className(
              "min-h-[200px] flex-auto overflow-y-auto bg-card-body",
              props.className,
            )}
          >
            {props.children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
