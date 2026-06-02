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
      onChange?: (value: string) => void;
    }
  | {
      type: "boolean";
      value?: boolean;
      onChange?: (value: boolean) => void;
    }
);

export function FormInput(props: React.PropsWithChildren<FormInputProps>) {
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
        "mb-[2.5em] w-full relative",
        props.inline && "flex flex-wrap",
        props.className
      )}
    >
      <div className={className(
        "text-lg mb-1.5 flex",
        props.inline && "flex mb-0 items-center"
      )}>{props.label}</div>
      <div className={className(
        "w-full [&_input]:w-full",
        props.inline && "w-max ml-auto flex"
      )}>
        {props.type === "boolean" && (
          <Toggle value={props.value} onChange={handleBooleanChange} />
        )}
        {props.type === "string" && (
          <input
            className="border border-[#1f274050] outline-none bg-white text-[#1f2740] text-[15px] p-1"
            type="text"
            placeholder={props.placeholder}
            value={props.value}
            onChange={handleChange}
          />
        )}
        {props.type === "number" && (
          <input
            className="border border-[#1f274050] outline-none bg-white text-[#1f2740] text-[15px] p-1 max-w-[40px] text-right"
            type="number"
            value={props.value}
            onChange={handleChange}
          />
        )}
        {props.error && (
          <label className="text-red-600 absolute top-full text-xs">{props.error}</label>
        )}
      </div>
      {props.legend && (
        <div className="w-4/5 flex-[100%] text-sm text-[#1f274080] lg:absolute top-[90%]">{props.legend}</div>
      )}
    </div>
  );
}
