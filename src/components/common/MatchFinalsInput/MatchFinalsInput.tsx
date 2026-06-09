import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import { CountryFlag } from "../CountryFlag";
import { CountrySelect } from "../CountrySelect";
import styles from "./MatchFinalsInput.module.scss";

interface MatchFinalsInputProps {
  className?: string;

  disabled?: boolean;

  countryLeftId?: string;
  goalsLeft?: number;
  penaltisLeft?: number | null;

  countryRightId?: string;
  goalsRight?: number;
  penaltisRight?: number | null;

  date: Date;

  order: number;

  onChange?: (value: {
    countryLeftId: string | undefined;
    goalsLeft: number | null;
    countryRightId: string | undefined;
    goalsRight: number | null;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  }) => void;

  countryInput?: boolean;
}

const parseResults = (value: {
  countryLeftId: string | undefined;
  goalsLeft: number | null;
  countryRightId: string | undefined;
  goalsRight: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}) => {
  if (
    (!value.goalsLeft && value.goalsLeft !== 0) ||
    (!value.goalsRight && value.goalsRight !== 0) ||
    value.goalsLeft !== value.goalsRight
  )
    return {
      ...value,
      penaltisLeft: null,
      penaltisRight: null,
    };
  return value;
};

export function MatchFinalsInput(
  props: React.PropsWithChildren<MatchFinalsInputProps>
) {
  const {
    onChange,
    goalsLeft,
    goalsRight,
    countryLeftId,
    countryRightId,
    penaltisLeft,
    penaltisRight,
  } = props;

  const i18n = useLocalizedText();

  const showPenaltis = React.useMemo(() => {
    if ((!goalsLeft && goalsLeft !== 0) || (!goalsRight && goalsRight !== 0))
      return false;
    return goalsLeft === goalsRight;
  }, [goalsLeft, goalsRight]);

  const countries = useCountries();

  const countryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryLeftId);
  }, [props.countryLeftId, countries]);

  const countryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryRightId);
  }, [props.countryRightId, countries]);

  const handleGoalsLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: parseInt(e.target.value, 10),
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft: penaltisLeft ?? null,
          penaltisRight: penaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      countryRightId,
      goalsRight,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handleGoalsRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: parseInt(e.target.value, 10),
          penaltisLeft: penaltisLeft ?? null,
          penaltisRight: penaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handlePenaltisRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft: penaltisLeft ?? null,
          penaltisRight: parseInt(e.target.value, 10),
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handlePenaltisLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft: parseInt(e.target.value, 10),
          penaltisRight: penaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisRight,
    ]
  );

  const handleCountryLeftChange = React.useCallback(
    (countryLeftId?: string) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      goalsLeft,
      countryRightId,
      goalsRight,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handleCountryRightChange = React.useCallback(
    (countryRightId?: string) => {
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handleLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (goalsLeft ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handleRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (goalsRight ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handlePenaltisLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (penaltisLeft ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const handlePenaltisRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (penaltisRight ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId,
          goalsLeft: goalsLeft ?? null,
          countryRightId,
          goalsRight: goalsRight ?? null,
          penaltisLeft,
          penaltisRight,
        })
      );
    },
    [
      onChange,
      countryLeftId,
      goalsLeft,
      goalsRight,
      countryRightId,
      penaltisLeft,
      penaltisRight,
    ]
  );

  const date = React.useMemo(() => {
    return formatDate(props.date, i18n.locale);
  }, [props.date, i18n.locale]);

  return (
    <div
      className={className(props.className, styles.matchFinalsInput)}
      style={{ order: props.order }}
    >
      <div className={styles.countryRow}>
        {props.countryInput && (
          <CountrySelect
            id={props.countryLeftId}
            onChange={handleCountryLeftChange}
          />
        )}
        {!props.countryInput && (
          <div className={className(styles.countryInput)}>
            {countryLeft?.code && (
              <CountryFlag
                className={styles.countryFlag}
                code={countryLeft?.code}
              />
            )}
            <label>{countryLeft?.name}</label>
          </div>
        )}
        <input
          type="number"
          inputMode={"decimal"}
          tabIndex={props.order * 4}
          data-testid="finals-match-goals-left"
          className={className(styles.goalsLeft)}
          defaultValue={props.goalsLeft}
          onChange={handleGoalsLeftChange}
          disabled={props.disabled}
          onBlur={handleLeftInputBlur}
        />
        {showPenaltis && (
          <input
            type="number"
            inputMode={"decimal"}
            tabIndex={props.order * 4 + 2}
            data-testid="finals-match-penalties-left"
            className={className(styles.penaltisLeft)}
            defaultValue={props.penaltisLeft ?? ""}
            onChange={handlePenaltisLeftChange}
            disabled={props.disabled}
            onBlur={handlePenaltisLeftInputBlur}
          />
        )}
      </div>
      <div className={styles.countryRow}>
        {props.countryInput && (
          <CountrySelect
            id={props.countryRightId}
            onChange={handleCountryRightChange}
          />
        )}
        {!props.countryInput && (
          <div className={className(styles.countryInput)}>
            {countryRight?.code && (
              <CountryFlag
                className={styles.countryFlag}
                code={countryRight?.code}
              />
            )}
            <label>{countryRight?.name}</label>
          </div>
        )}
        <input
          type="number"
          inputMode={"decimal"}
          tabIndex={props.order * 4 + 1}
          data-testid="finals-match-goals-right"
          className={className(styles.goalsRight)}
          defaultValue={props.goalsRight}
          onChange={handleGoalsRightChange}
          disabled={props.disabled}
          onBlur={handleRightInputBlur}
        />
        {showPenaltis && (
          <input
            type="number"
            inputMode={"decimal"}
            tabIndex={props.order * 4 + 3}
            data-testid="finals-match-penalties-right"
            className={className(styles.penaltisRight)}
            defaultValue={props.penaltisRight ?? ""}
            onChange={handlePenaltisRightChange}
            disabled={props.disabled}
            onBlur={handlePenaltisRightInputBlur}
          />
        )}
      </div>
      <div className={styles.date}>{date}</div>
    </div>
  );
}
