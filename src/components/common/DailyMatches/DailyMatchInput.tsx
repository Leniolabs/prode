import React from "react";
import { useCountries } from "../../../hooks";
import { useInterval } from "../../../hooks/useInterval";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate, formatHour } from "../../../utils/date";
import { matchResultStatus } from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";
import { LockIcon } from "../Icons";
import styles from "./DailyMatches.module.scss";

interface DailyMatchInputProps {
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

  today?: boolean;

  onChange?: (goalsLeft: number | null, goalsRight: number | null) => void;
}

export function DailyMatchInput(
  props: React.PropsWithChildren<DailyMatchInputProps>
) {
  const countries = useCountries();
  const i18n = useLocalizedText();
  const counterRef = React.useRef<HTMLDivElement>(null);

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
    return props.today
      ? formatHour(props.date, i18n.locale)
      : formatDate(props.date, i18n.locale);
  }, [props.today, props.date, i18n.locale]);

  const updateMatchStatus = React.useCallback(() => {
    const timeLeft = (props.date.getTime() - new Date().getTime()) / 1000;

    const hours = Math.floor((timeLeft - 10 * 60) / (60 * 60));
    const minutes = Math.floor((timeLeft - 10 * 60) / 60);

    counterRef.current?.setAttribute("data-show", "true");

    if (hours > 0) {
      counterRef.current?.setAttribute("data-status", "warning");
      counterRef.current?.setAttribute(
        "data-timer",
        i18n.timeLeftHoursTemplate
          .replace("{d}", hours.toString())
          .replace("{s}", hours > 1 ? "s" : "")
      );
      return;
    } else if (minutes > 15) {
      counterRef.current?.setAttribute("data-status", "warning");
      counterRef.current?.setAttribute(
        "data-timer",
        i18n.timeLeftMinutesTemplate
          .replace("{d}", minutes.toString())
          .replace("{s}", minutes > 1 ? "s" : "")
      );
    } else if (minutes > 0) {
      counterRef.current?.setAttribute("data-status", "danger");
      counterRef.current?.setAttribute(
        "data-timer",
        i18n.timeLeftMinutesTemplate
          .replace("{d}", minutes.toString())
          .replace("{s}", minutes > 1 ? "s" : "")
      );
    } else {
      counterRef.current?.setAttribute("data-status", "");
      counterRef.current?.setAttribute("data-timer", "");
    }
  }, [props.date, i18n]);

  useInterval(updateMatchStatus, 60000);

  return (
    <div className={className(props.className, styles.dailyMatchInput)}>
      <label>
        <CountryFlag code={countryLeft?.code} />
        {countryLeft?.name}
      </label>
      <div className={styles.centerContainer}>
        <div className={styles.inputsContainer}>
          <div className={styles.leftInput}>
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              className={className(
                styles.leftGoals,
                resultStatus && styles[resultStatus]
              )}
              defaultValue={props.userGoalsLeft ?? ""}
              onChange={handleLeftGoalsChange}
              disabled={props.disabled}
              onBlur={handleLeftInputBlur}
            />
          </div>
          <div className={styles.rightInput}>
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              className={className(
                styles.rightGoals,
                resultStatus && styles[resultStatus]
              )}
              defaultValue={props.userGoalsRight ?? ""}
              onChange={handleRightGoalsChange}
              disabled={props.disabled}
              onBlur={handleRightInputBlur}
            />
          </div>
        </div>
        <div className={styles.date}>
          {date}
          {props.filled && (
            <div className={styles.result}>
              <span>{i18n.matchResultLabel}:</span>
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
          )}
        </div>
      </div>
      <label>
        <CountryFlag code={countryRight?.code} />
        {countryRight?.name}
      </label>
      <div
        ref={counterRef}
        data-show="false"
        data-timer=""
        data-status=""
        className={styles.dailyMatchTimer}
      >
        <LockIcon />
      </div>
    </div>
  );
}
