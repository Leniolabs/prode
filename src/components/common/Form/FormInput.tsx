import React from "react";
import { className } from "../../../utils/classname";
import { Toggle } from "../Toggle";
import styles from "./Form.module.scss";

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
        props.className,
        styles.formInput,
        props.inline && styles.inline
      )}
    >
      <div className={styles.formInputLabel}>{props.label}</div>
      <div className={styles.formInputValue}>
        {props.type === "boolean" && (
          <Toggle value={props.value} onChange={handleBooleanChange} />
        )}
        {props.type === "string" && (
          <input
            type="text"
            placeholder={props.placeholder}
            value={props.value}
            onChange={handleChange}
          />
        )}
        {props.type === "number" && (
          <input type="number" value={props.value} onChange={handleChange} />
        )}
        {props.error && (
          <label className={styles.formInputError}>{props.error}</label>
        )}
      </div>
      {props.legend && (
        <div className={styles.formInputLegend}>{props.legend}</div>
      )}
    </div>
  );
}
