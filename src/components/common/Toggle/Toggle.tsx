import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Toggle.module.scss";

interface ToggleProps {
  id?: string;
  className?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Toggle(props: React.PropsWithChildren<ToggleProps>) {
  const { onChange, value } = props;
  const handleClick = React.useCallback(() => {
    onChange?.(!value);
  }, [onChange, value]);

  return (
    <button
      id={props.id}
      type="button"
      role="switch"
      aria-checked={!!props.value}
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      className={className(
        styles.toggle,
        props.className,
        props.disabled && styles.disabled,
        props.value && styles.toggled
      )}
      onClick={handleClick}
    >
      <div className={styles.innerToggle} />
    </button>
  );
}
