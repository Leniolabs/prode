import React from "react";
import { className } from "../../../utils/classname";
import styles from "./CountryFlag.module.scss";

interface CountryFlagProps {
  className?: string;
  code?: string;
  tiny?: boolean;
  disabled?: boolean;
}

export function CountryFlag(props: React.PropsWithChildren<CountryFlagProps>) {
  return (
    <div
      className={className(
        props.className,
        styles.countryFlag,
        props.tiny && styles.tiny,
        props.disabled && styles.disabled
      )}
    >
      <img src={`/flags/${props.code}.png`} />
    </div>
  );
}
