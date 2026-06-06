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
        styles.formInput,
        props.inline && styles.inline
      )}
    >
      {props.label && (
        <label className={styles.formInputLabel} htmlFor={inputId}>
          {props.label}
        </label>
      )}
      <div className={styles.formInputValue}>
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
          />
        )}
        {props.error && (
          <div id={errorId} role="alert" className={styles.formInputError}>
            {props.error}
          </div>
        )}
      </div>
      {props.legend && (
        <div className={styles.formInputLegend}>{props.legend}</div>
      )}
    </div>
  );
}
