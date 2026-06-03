import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Toggle.module.scss";

interface ToggleProps {
  className?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle(props: React.PropsWithChildren<ToggleProps>) {
  const handleClick = React.useCallback(() => {
    props.onChange?.(!props.value);
  }, [props.onChange, props.value]);

  return (
    <div
      className={className(
        styles.toggle,
        props.className,
        props.disabled && styles.disabled,
        props.value && styles.toggled
      )}
      onClick={handleClick}
    >
      <div className={styles.innerToggle} />
    </div>
  );
}
