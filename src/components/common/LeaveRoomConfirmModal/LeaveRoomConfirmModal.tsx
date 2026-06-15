"use client";

import React from "react";
import { useLocalizedText } from "../../../locale";
import { Button } from "../Button";
import { Modal } from "../Modal";

interface LeaveRoomConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function LeaveRoomConfirmModal(props: LeaveRoomConfirmModalProps) {
  const i18n = useLocalizedText();
  const [value, setValue] = React.useState("");

  const keyword = i18n.leaveRoomConfirmKeyword;
  const confirmed = value.trim().toUpperCase() === keyword.toUpperCase();

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  return (
    <Modal
      title={i18n.leaveRoomConfirmTitle}
      headerClassName="!bg-[#e02045]"
      className="flex !min-h-max flex-col gap-4 p-4"
      onClose={props.onCancel}
    >
      <p role="alert" className="m-0 text-dark-navy">
        {i18n.leaveRoomConfirmWarning}
      </p>
      <label className="flex flex-col gap-2 text-dark-navy">
        <span>
          {i18n.leaveRoomConfirmPromptPrefix}{" "}
          <strong>{keyword}</strong> {i18n.leaveRoomConfirmPromptSuffix}
        </span>
        <input
          placeholder={i18n.leaveRoomConfirmInputPlaceholder}
          className="rounded-input border border-neutral-gray bg-transparent p-3 text-dark-navy shadow-none outline-none"
          data-testid="leave-room-confirm-input"
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={props.onCancel}>
          {i18n.leaveRoomConfirmCancel}
        </Button>
        <Button
          variant="danger"
          disabled={!confirmed}
          onClick={confirmed ? props.onConfirm : undefined}
        >
          {i18n.leaveRoomConfirmAccept}
        </Button>
      </div>
    </Modal>
  );
}
