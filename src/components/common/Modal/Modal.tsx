import React from "react";
import { className } from "../../../utils/classname";
import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";

interface ModalProps {
  className?: string;
  title: string;
  onClose?: () => void;
}

export function Modal(props: React.PropsWithChildren<ModalProps>) {
  return (
    <div className="fixed left-0 top-0 w-screen h-screen flex z-[999999] overflow-y-scroll before:content-[''] before:bg-[#1f2740cc] before:absolute before:left-0 before:top-0 before:w-screen before:h-screen">
      <div className="z-[1] block m-auto max-w-full min-w-0 sm:min-w-[400px]">
        <div className="w-full bg-[#1f2740] text-white text-2xl font-bold p-1 px-2 relative">
          {props.title}
          {props.onClose && (
            <div className="absolute right-0 top-0">
              <ButtonIcon onClick={props.onClose}>
                <CloseIcon />
              </ButtonIcon>
            </div>
          )}
        </div>
        <div className={className("bg-[#f6f5f5cc] min-h-[200px]", props.className)}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
