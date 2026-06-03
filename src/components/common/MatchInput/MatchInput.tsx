import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import {
  getAdminFinalsMatchWinner,
  getAdminMatchWinner,
  matchResultStatus,
} from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";
import styles from "./MatchInput.module.scss";

interface MatchInputProps {
  className?: string;

  disabled?: boolean;

  countryLeftId: string;
  goalsLeft?: number | null;
  userGoalsLeft?: number | null;

  countryRightId: string;
  goalsRight?: number | null;
  userGoalsRight?: number | null;

  date: Date;

  filled?: boolean;

  onChange?: (goalsLeft: number | null, goalsRight: number | null) => void;
}

export function MatchInput(props: React.PropsWithChildren<MatchInputProps>) {
  const countries = useCountries();
  const i18n = useLocalizedText();

  const countryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryLeftId);
  }, [props.countryLeftId, countries]);

  const countryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryRightId);
  }, [props.countryRightId, countries]);

  const handleLeftGoalsChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        parseInt(e.target.value, 10),
        props.userGoalsRight ?? null
      );
    },
    [props.onChange, props.userGoalsRight]
  );

  const handleRightGoalsChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        props.userGoalsLeft ?? null,
        parseInt(e.target.value, 10)
      );
    },
    [props.onChange, props.userGoalsLeft]
  );

  const handleLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userGoalsLeft ?? "").toString();
      props.onChange?.(
        props.userGoalsLeft ?? null,
        props.userGoalsRight ?? null
      );
    },
    [props.userGoalsLeft, props.userGoalsRight]
  );

  const handleRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userGoalsRight ?? "").toString();
      props.onChange?.(
        props.userGoalsLeft ?? null,
        props.userGoalsRight ?? null
      );
    },
    [props.userGoalsLeft, props.userGoalsRight]
  );

  const resultStatus = React.useMemo(() => {
    return matchResultStatus(
      {
        filled: props.filled || false,
        goalsLeft: props.goalsLeft ?? null,
        goalsRight: props.goalsRight ?? null,
      },
      {
        goalsLeft: props.userGoalsLeft ?? null,
        goalsRight: props.userGoalsRight ?? null,
      }
    );
  }, [
    props.filled,
    props.goalsLeft,
    props.goalsRight,
    props.userGoalsLeft,
    props.userGoalsRight,
  ]);

  const date = React.useMemo(() => {
    return formatDate(props.date, i18n.locale);
  }, [props.date, i18n.locale]);

  return (
    <div className={className(props.className, styles.matchInput)}>
      <div className={styles.leftTeam}>
        <CountryFlag code={countryLeft?.code} />
        <label data-tooltip={countryLeft?.name}>{countryLeft?.code}</label>
      </div>
      <div className={styles.centerContainer}>
        <div className={styles.inputsContainer}>
          <input
            min={0}
            max={99}
            type="number"
            inputMode={"decimal"}
            className={className(
              styles.leftGoals,
              resultStatus && styles[resultStatus]
            )}
            value={props.userGoalsLeft ?? ""}
            onChange={handleLeftGoalsChange}
            disabled={props.disabled}
            onBlur={handleLeftInputBlur}
          />
          <input
            min={0}
            max={99}
            type="number"
            inputMode={"decimal"}
            className={className(
              styles.rightGoals,
              resultStatus && styles[resultStatus]
            )}
            value={props.userGoalsRight ?? ""}
            onChange={handleRightGoalsChange}
            disabled={props.disabled}
            onBlur={handleRightInputBlur}
          />
        </div>
        {props.filled ? (
          <>
            <div className={styles.date}>
              <span>Resultado:</span>
              <CountryFlag
                className={styles.countryFlag}
                code={countryLeft?.code}
                tiny
                disabled={(props.goalsLeft || 0) < (props.goalsRight || 0)}
              />
              {props.goalsLeft}
              {"-"}
              {props.goalsRight}{" "}
              <CountryFlag
                className={styles.countryFlag}
                code={countryRight?.code}
                tiny
                disabled={(props.goalsLeft || 0) > (props.goalsRight || 0)}
              />
            </div>
          </>
        ) : (
          <div className={styles.date}>{date}</div>
        )}
      </div>
      <div className={styles.rightTeam}>
        <label data-tooltip={countryRight?.name}>{countryRight?.code}</label>
        <CountryFlag code={countryRight?.code} />
      </div>
    </div>
  );
}
