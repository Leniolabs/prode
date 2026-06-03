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

export function getResultStatus(userMatch: {
  goalsLeft: number;
  goalsRight: number;
  match: {
    goalsLeft: number | null;
    goalsRight: number | null;
    penaltisLeft?: number | null;
    penaltisRight?: number | null;
  };
  penaltisLeft?: number | null;
  penaltisRight?: number | null;
}) {
  const { match } = userMatch;

  if (
    (!match.goalsLeft && match.goalsLeft !== 0) ||
    (!match.goalsRight && match.goalsRight !== 0)
  )
    //no esta completo
    return undefined;

  if (
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight &&
    match.penaltisLeft === userMatch.penaltisLeft &&
    match.penaltisRight === userMatch.penaltisRight
  )
    //resultado perfecto
    return "GOALS_MATCH";

  if (
    match.goalsLeft !== match.goalsRight &&
    match.goalsLeft === userMatch.goalsLeft &&
    match.goalsRight === userMatch.goalsRight
  )
    //no es empate pero resultado perfecto
    return "GOALS_MATCH";

  if (match.goalsLeft > match.goalsRight) {
    //gana left en goles
    if (userMatch.goalsLeft > userMatch.goalsRight) {
      //predice que gana left
      return "WINNER_MATCH";
    }

    if (
      userMatch.goalsLeft === userMatch.goalsRight &&
      (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
      (userMatch.penaltisRight || userMatch.penaltisRight === 0)
    ) {
      //predice que empatan
      if (userMatch.penaltisLeft > userMatch.penaltisRight) {
        //predice que gana left en penales
        return "WINNER_MATCH";
      }
    }

    return "WRONG";
  }

  if (match.goalsLeft < match.goalsRight) {
    //gana right en goles
    if (userMatch.goalsLeft < userMatch.goalsRight) {
      //predice que gana right
      return "WINNER_MATCH";
    }

    if (
      userMatch.goalsLeft === userMatch.goalsRight &&
      (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
      (userMatch.penaltisRight || userMatch.penaltisRight === 0)
    ) {
      //predice que empatan
      if (userMatch.penaltisLeft < userMatch.penaltisRight) {
        //predice que gana right en penales
        return "WINNER_MATCH";
      }
    }

    return "WRONG";
  }

  if (
    match.goalsLeft === match.goalsRight &&
    (match.penaltisLeft || match.penaltisLeft === 0) &&
    (match.penaltisRight || match.penaltisRight === 0)
  ) {
    //empate

    if (match.penaltisLeft > match.penaltisRight) {
      //gana left en penales

      if (
        userMatch.goalsLeft === userMatch.goalsRight &&
        (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
        (userMatch.penaltisRight || userMatch.penaltisRight === 0)
      ) {
        //predice que empatan
        if (userMatch.penaltisLeft > userMatch.penaltisRight) {
          //predice que gana left en penales

          if (
            userMatch.goalsLeft === match.goalsLeft &&
            userMatch.goalsRight === match.goalsRight
          ) {
            //predice el ganador sin penales exactos
            //pero los goles estan ok
            return "GOALS_MATCH";
          }

          return "WINNER_MATCH";
        }
      }

      if (userMatch.goalsLeft > userMatch.goalsRight) {
        //predice que gana left
        return "WINNER_MATCH";
      }

      return "WRONG";
    }

    if (match.penaltisLeft < match.penaltisRight) {
      //gana right en paneles

      if (
        userMatch.goalsLeft === userMatch.goalsRight &&
        (userMatch.penaltisLeft || userMatch.penaltisLeft === 0) &&
        (userMatch.penaltisRight || userMatch.penaltisRight === 0)
      ) {
        //predice que empatan
        if (userMatch.penaltisLeft < userMatch.penaltisRight) {
          //predice que gana right en penales

          if (
            userMatch.goalsLeft === match.goalsLeft &&
            userMatch.goalsRight === match.goalsRight
          ) {
            //predice el ganador sin penales exactos
            //pero los goles estan ok
            return "GOALS_MATCH";
          }

          return "WINNER_MATCH";
        }
      }

      if (userMatch.goalsLeft < userMatch.goalsRight) {
        //predice que gana right
        return "WINNER_MATCH";
      }

      return "WRONG";
    }

    return "WRONG";
  }

  return "WRONG";
}

interface DailyMatchFinalInputProps {
  className?: string;

  disabled?: boolean;
  submissionEndsAt?: Date | string | null;

  userCountryLeftId?: string;
  userGoalsLeft?: number | null;
  userPenaltisLeft?: number | null;

  userCountryRightId?: string;
  userGoalsRight?: number | null;
  userPenaltisRight?: number | null;

  countryLeftId?: string;
  goalsLeft?: number | null;
  countryRightId?: string;
  goalsRight?: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;

  date: Date;

  filled?: boolean;

  order: number;

  today?: boolean;

  onChange?: (value: {
    countryLeftId: string | undefined;
    goalsLeft: number | null;
    countryRightId: string | undefined;
    goalsRight: number | null;
    penaltisLeft: number | null;
    penaltisRight: number | null;
  }) => void;
}

const parseResults = (value: {
  countryLeftId: string | undefined;
  goalsLeft: number | null;
  countryRightId: string | undefined;
  goalsRight: number | null;
  penaltisLeft: number | null;
  penaltisRight: number | null;
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

export function DailyMatchFinalInput(
  props: React.PropsWithChildren<DailyMatchFinalInputProps>
) {
  const countries = useCountries();
  const i18n = useLocalizedText();
  const counterRef = React.useRef<HTMLDivElement>(null);

  const showPenaltis = React.useMemo(() => {
    if (
      (!props.userGoalsLeft && props.userGoalsLeft !== 0) ||
      (!props.userGoalsRight && props.userGoalsRight !== 0)
    )
      return false;
    return props.userGoalsLeft === props.userGoalsRight;
  }, [props.userGoalsLeft, props.userGoalsRight]);

  const countryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryLeftId);
  }, [props.countryLeftId, countries]);

  const userCountryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === props.userCountryLeftId);
  }, [props.userCountryLeftId, countries]);

  const countryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryRightId);
  }, [props.countryRightId, countries]);

  const userCountryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === props.userCountryRightId);
  }, [props.userCountryRightId, countries]);

  const submissionEndsAt = React.useMemo(() => {
    return props.submissionEndsAt ? new Date(props.submissionEndsAt) : null;
  }, [props.submissionEndsAt]);

  const resultStatus = React.useMemo(() => {
    return getResultStatus({
      goalsLeft: props.userGoalsLeft || 0,
      goalsRight: props.userGoalsRight || 0,
      penaltisLeft: props.userPenaltisLeft ?? null,
      penaltisRight: props.userPenaltisRight ?? null,
      match: {
        goalsLeft: props.goalsLeft ?? null,
        goalsRight: props.goalsRight ?? null,
        penaltisLeft: props.penaltisLeft ?? null,
        penaltisRight: props.penaltisRight ?? null,
      },
    });
  }, [
    props.goalsRight,
    props.goalsLeft,
    props.userGoalsRight,
    props.userGoalsLeft,
    props.penaltisLeft,
    props.penaltisRight,
    props.userPenaltisLeft,
    props.userPenaltisRight,
  ]);

  const penaltisStatus = React.useMemo(() => {
    if (resultStatus === "WRONG") return "WRONG";

    if (
      (!props.userPenaltisRight && props.userPenaltisRight !== 0) ||
      (!props.userPenaltisLeft && props.userPenaltisLeft !== 0)
    )
      return "";

    if (
      (!props.penaltisRight && props.penaltisRight !== 0) ||
      (!props.penaltisLeft && props.penaltisLeft !== 0)
    ) {
      return "WINNER_MATCH";
    }

    if (
      props.userPenaltisRight === props.penaltisRight &&
      props.userPenaltisLeft === props.penaltisLeft
    )
      return "GOALS_MATCH";

    if (
      (props.userPenaltisRight >= props.userPenaltisLeft &&
        props.penaltisRight >= props.penaltisLeft) ||
      (props.userPenaltisRight <= props.userPenaltisLeft &&
        props.penaltisRight <= props.penaltisLeft)
    )
      return "WINNER_MATCH";

    return "WRONG";
  }, [
    resultStatus,
    props.goalsRight,
    props.goalsLeft,
    props.userGoalsRight,
    props.userGoalsLeft,
    props.penaltisLeft,
    props.penaltisRight,
    props.userPenaltisLeft,
    props.userPenaltisRight,
  ]);

  const handleGoalsLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: parseInt(e.target.value, 10),
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userCountryRightId,
      props.userGoalsRight,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handleGoalsRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: parseInt(e.target.value, 10),
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userCountryRightId,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handleLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userGoalsLeft ?? "").toString();
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userGoalsRight,
      props.userCountryRightId,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handleRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userGoalsRight ?? "").toString();
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userGoalsRight,
      props.userCountryRightId,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handlePenaltisLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: parseInt(e.target.value, 10),
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userCountryRightId,
      props.userGoalsRight,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handlePenaltisRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: parseInt(e.target.value, 10),
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userGoalsRight,
      props.userCountryRightId,
      props.userPenaltisLeft,
    ]
  );

  const handlePenaltisLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userPenaltisLeft ?? "").toString();
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userGoalsRight,
      props.userCountryRightId,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const handlePenaltisRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.userPenaltisRight ?? "").toString();
      props.onChange?.(
        parseResults({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: props.userGoalsRight ?? null,
          penaltisLeft: props.userPenaltisLeft ?? null,
          penaltisRight: props.userPenaltisRight ?? null,
        })
      );
    },
    [
      props.onChange,
      props.userCountryLeftId,
      props.userGoalsLeft,
      props.userGoalsRight,
      props.userCountryRightId,
      props.userPenaltisLeft,
      props.userPenaltisRight,
    ]
  );

  const date = React.useMemo(() => {
    return props.today
      ? formatHour(props.date, i18n.locale)
      : formatDate(props.date, i18n.locale);
  }, [props.today, props.date, i18n.locale]);

  const updateMatchStatus = React.useCallback(() => {
    const deadline = submissionEndsAt
      ? submissionEndsAt.getTime()
      : props.date.getTime() - 10 * 60 * 1000;
    const timeLeft = (deadline - new Date().getTime()) / 1000;
    const offset = submissionEndsAt ? 0 : 10 * 60;

    const hours = Math.floor((timeLeft - offset) / (60 * 60));
    const minutes = Math.floor((timeLeft - offset) / 60);

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
  }, [props.date, i18n, submissionEndsAt]);

  useInterval(updateMatchStatus, 60000);

  return (
    <div className={className(props.className, styles.dailyMatchFinalsInput)}>
      <label>
        {countryLeft && <CountryFlag code={countryLeft.code} />}
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
              tabIndex={props.order * 4}
              className={className(
                styles.leftGoals,
                resultStatus && styles[resultStatus]
              )}
              defaultValue={props.userGoalsLeft ?? ""}
              onChange={handleGoalsLeftChange}
              disabled={props.disabled}
              onBlur={handleLeftInputBlur}
            />
            {showPenaltis && (
              <>
                <div className={styles.penaltisDivider} />
                <input
                  min={0}
                  max={99}
                  type="number"
                  inputMode={"decimal"}
                  tabIndex={props.order * 4 + 2}
                  className={className(
                    styles.penaltisLeft,
                    penaltisStatus && styles[penaltisStatus]
                  )}
                  defaultValue={props.userPenaltisLeft ?? ""}
                  onChange={handlePenaltisLeftChange}
                  disabled={!userCountryLeft || props.disabled}
                  onBlur={handlePenaltisLeftInputBlur}
                />
              </>
            )}
          </div>
          <div className={styles.rightInput}>
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              tabIndex={props.order * 4 + 1}
              className={className(
                styles.rightGoals,
                resultStatus && styles[resultStatus]
              )}
              defaultValue={props.userGoalsRight ?? ""}
              onChange={handleGoalsRightChange}
              disabled={props.disabled}
              onBlur={handleRightInputBlur}
            />
            {showPenaltis && (
              <>
                <div className={styles.penaltisDivider} />
                <input
                  min={0}
                  max={99}
                  type="number"
                  inputMode={"decimal"}
                  tabIndex={props.order * 4 + 3}
                  className={className(
                    styles.penaltisRight,
                    penaltisStatus && styles[penaltisStatus]
                  )}
                  defaultValue={props.userPenaltisRight ?? ""}
                  onChange={handlePenaltisRightChange}
                  disabled={!userCountryRight || props.disabled}
                  onBlur={handlePenaltisRightInputBlur}
                />
              </>
            )}
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
              {props.goalsRight === props.goalsLeft && (
                <>
                  {"("}
                  {props.penaltisLeft}
                  {"-"}
                  {props.penaltisRight}
                  {")"}
                </>
              )}
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
        {countryRight && <CountryFlag code={countryRight?.code} />}
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
