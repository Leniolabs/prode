import React from "react";
import { className } from "../../../utils/classname";
import { Toggle } from "../Toggle";

type FormInputProps = {
  className?: string;
  label?: string;
  legend?: React.ReactNode;
  type: "number" | "string" | "boolean";
  inline?: boolean;
  error?: string;
} & (
  | {
      type: "number";
      value?: number;
      onChange?: (value: number) => void;
    }
  | {
      type: "string";
      value?: string;
      placeholder?: string;
      inputType?: string;
      onChange?: (value: string) => void;
    }
  | {
      type: "boolean";
      value?: boolean;
      onChange?: (value: boolean) => void;
    }
);

export function FormInput(props: React.PropsWithChildren<FormInputProps>) {
  const inputId = React.useId();
  const errorId = props.error ? `${inputId}-error` : undefined;

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = e.target;

      if (props.type === "boolean") props.onChange?.(checked);
      else if (props.type === "string") props.onChange?.(value);
      else if (props.type === "number")
        props.onChange?.(value ? parseInt(value, 10) : 0);
    },
    [props.onChange, props.type]
  );

  const handleBooleanChange = React.useCallback(
    (checked: boolean) => {
      if (props.type === "boolean") {
        props.onChange?.(checked);
      }
    },
    [props.onChange, props.type]
  );

  return (
    <div
      className={className(
        props.className,
        "mb-[2.5em] w-full relative",
        props.inline && "flex flex-wrap"
      )}
    >
      {props.label && (
        <label
          className={className(
            "text-[18px] mb-[6px] flex text-brand-blue",
            props.inline && "flex mb-0 items-center"
          )}
          htmlFor={inputId}
        >
          {props.label}
        </label>
      )}
      <div
        className={className(
          "w-full",
          props.inline && "w-max ml-auto flex"
        )}
      >
        {props.type === "boolean" && (
          <Toggle
            id={inputId}
            ariaLabel={props.label}
            value={props.value}
            onChange={handleBooleanChange}
          />
        )}
        {props.type === "string" && (
          <input
            id={inputId}
            type={props.inputType ?? "text"}
            placeholder={props.placeholder}
            value={props.value}
            onChange={handleChange}
            aria-invalid={!!props.error}
            aria-describedby={errorId}
            className="w-full border border-neutral-gray rounded-input outline-none bg-white text-dark-navy text-[15px] px-[10px] py-[8px]"
          />
        )}
        {props.type === "number" && (
          <input
            id={inputId}
            type="number"
            value={props.value}
            onChange={handleChange}
            aria-invalid={!!props.error}
            aria-describedby={errorId}
            className="border border-neutral-gray rounded-input outline-none bg-white text-dark-navy text-[15px] px-[10px] py-[8px] max-w-[60px] text-right"
          />
        )}
        {props.error && (
          <div
            id={errorId}
            role="alert"
            className="text-red-600 absolute top-full text-[12px]"
          >
            {props.error}
          </div>
        )}
      </div>
      {props.legend && (
        <div className="w-4/5 flex-[100%] text-[14px] text-form-legend lg:absolute lg:top-[90%]">
          {props.legend}
        </div>
      )}
    </div>
  );
}
