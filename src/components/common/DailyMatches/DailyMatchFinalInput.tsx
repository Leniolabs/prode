import React from "react";
import { useCountries } from "../../../hooks";
import { useInterval } from "../../../hooks/useInterval";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate, formatHour } from "../../../utils/date";
import { matchResultStatus } from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";
import { LockIcon } from "../Icons";

type EditableFinalsInput = {
  countryLeftId: string | undefined;
  goalsLeft: number | null;
  countryRightId: string | undefined;
  goalsRight: number | null;
  penaltisLeft: number | null;
  penaltisRight: number | null;
};

function getPenaltyWinnerSide({
  penaltisLeft,
  penaltisRight,
}: Pick<EditableFinalsInput, "penaltisLeft" | "penaltisRight">) {
  if (penaltisLeft == null || penaltisRight == null) return undefined;
  if (penaltisLeft > penaltisRight) return "left";
  if (penaltisLeft < penaltisRight) return "right";
  return undefined;
}

function sanitizeEditableFinalsInput(value: EditableFinalsInput) {
  if (
    (!value.goalsLeft && value.goalsLeft !== 0) ||
    (!value.goalsRight && value.goalsRight !== 0) ||
    value.goalsLeft !== value.goalsRight
  ) {
    return {
      ...value,
      penaltisLeft: null,
      penaltisRight: null,
    };
  }

  return value;
}

function finalizeEditableFinalsInput(value: EditableFinalsInput) {
  const parsed = sanitizeEditableFinalsInput(value);
  if (
    parsed.penaltisLeft != null &&
    parsed.penaltisRight != null &&
    parsed.penaltisLeft === parsed.penaltisRight
  ) {
    return {
      ...parsed,
      penaltisLeft: null,
      penaltisRight: null,
    };
  }

  return parsed;
}

function parseInputValue(value: string) {
  return value === "" ? null : parseInt(value, 10);
}

function restoreInputValue(
  input: HTMLInputElement,
  value: number | null | undefined
) {
  const nextValue = value == null ? "" : value.toString();
  input.value = nextValue;
  window.requestAnimationFrame(() => {
    input.value = nextValue;
  });
}

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

const scoreInputClass =
  "text-[20px] bg-transparent w-10 h-10 rounded-[2px] outline-none text-black text-center border border-[#767676] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-80";

const penaltisInputClass =
  "mt-auto w-[18px] h-[18px] rounded-[2px] text-[12px] border border-[#767676] border-l-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-80 max-lg:text-[20px] max-lg:border-0 max-lg:w-10 max-lg:h-10";

const scoreInputStatusClass: Record<string, string> = {
  GOALS_MATCH: "!bg-correct !border-correct",
  WINNER_MATCH: "!bg-winner !border-winner",
  WRONG: "!bg-wrong !border-wrong",
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

  const displayCountryLeft = userCountryLeft ?? countryLeft;
  const displayCountryRight = userCountryRight ?? countryRight;

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

    const userWinner = getPenaltyWinnerSide({
      penaltisLeft: props.userPenaltisLeft ?? null,
      penaltisRight: props.userPenaltisRight ?? null,
    });
    if (!userWinner) return "";

    const actualWinner = getPenaltyWinnerSide({
      penaltisLeft: props.penaltisLeft ?? null,
      penaltisRight: props.penaltisRight ?? null,
    });

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

    if (actualWinner && userWinner === actualWinner)
      return "WINNER_MATCH";

    return "WRONG";
  }, [
    resultStatus,
    props.penaltisLeft,
    props.penaltisRight,
    props.userPenaltisLeft,
    props.userPenaltisRight,
  ]);

  const handleGoalsLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(
        sanitizeEditableFinalsInput({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: parseInputValue(e.target.value),
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
        sanitizeEditableFinalsInput({
          countryLeftId: props.userCountryLeftId,
          goalsLeft: props.userGoalsLeft ?? null,
          countryRightId: props.userCountryRightId,
          goalsRight: parseInputValue(e.target.value),
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
        finalizeEditableFinalsInput({
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
        finalizeEditableFinalsInput({
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
      const penaltisLeft = parseInputValue(e.target.value);
      const nextValue = sanitizeEditableFinalsInput({
        countryLeftId: props.userCountryLeftId,
        goalsLeft: props.userGoalsLeft ?? null,
        countryRightId: props.userCountryRightId,
        goalsRight: props.userGoalsRight ?? null,
        penaltisLeft,
        penaltisRight: props.userPenaltisRight ?? null,
      });

      if (
        penaltisLeft != null &&
        nextValue.penaltisRight != null &&
        penaltisLeft === nextValue.penaltisRight
      ) {
        restoreInputValue(e.target, props.userPenaltisLeft);
        return;
      }

      props.onChange?.(nextValue);
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
      const penaltisRight = parseInputValue(e.target.value);
      const nextValue = sanitizeEditableFinalsInput({
        countryLeftId: props.userCountryLeftId,
        goalsLeft: props.userGoalsLeft ?? null,
        countryRightId: props.userCountryRightId,
        goalsRight: props.userGoalsRight ?? null,
        penaltisLeft: props.userPenaltisLeft ?? null,
        penaltisRight,
      });

      if (
        penaltisRight != null &&
        nextValue.penaltisLeft != null &&
        penaltisRight === nextValue.penaltisLeft
      ) {
        restoreInputValue(e.target, props.userPenaltisRight);
        return;
      }

      props.onChange?.(nextValue);
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
        finalizeEditableFinalsInput({
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
        finalizeEditableFinalsInput({
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
    <div
      className={className(
        props.className,
        "flex items-center relative px-4 pt-4 pb-[6px] gap-[6px]",
        "[&:has([data-show='true'])]:pt-8",
        "[&:has(.result)]:pb-6",
        "[&_+_.dailyMatchInput]:border-t [&_+_.dailyMatchInput]:border-[#767676]"
      )}
    >
      {/* Left team */}
      <div className="flex items-center flex-1 min-w-0 gap-[6px]">
        {displayCountryLeft && <CountryFlag code={displayCountryLeft.code} />}
        <label
          className="text-[14px] font-bold whitespace-nowrap relative cursor-default group"
          data-tooltip={displayCountryLeft?.name}
        >
          {displayCountryLeft?.shortName}
          <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-normal whitespace-nowrap px-[7px] py-[3px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            {displayCountryLeft?.name}
          </span>
        </label>
      </div>

      {/* Center */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="flex">
          {/* Left input group */}
          <div className="flex relative">
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              tabIndex={props.order * 4}
              className={className(
                scoreInputClass,
                resultStatus ? scoreInputStatusClass[resultStatus] : ""
              )}
              value={props.userGoalsLeft ?? ""}
              onChange={handleGoalsLeftChange}
              disabled={props.disabled}
              onBlur={handleLeftInputBlur}
            />
            {showPenaltis && (
              <>
                <div className="penaltis-divider" />
                <input
                  key={`daily-pen-left-${showPenaltis ? "on" : "off"}`}
                  min={0}
                  max={99}
                  type="number"
                  inputMode={"decimal"}
                  tabIndex={props.order * 4 + 2}
                  className={className(
                    penaltisInputClass,
                    penaltisStatus ? scoreInputStatusClass[penaltisStatus] : ""
                  )}
                  value={props.userPenaltisLeft ?? ""}
                  onChange={handlePenaltisLeftChange}
                  disabled={!userCountryLeft || props.disabled}
                  onBlur={handlePenaltisLeftInputBlur}
                />
              </>
            )}
          </div>
          {/* Right input group */}
          <div className="flex relative ml-[6px]">
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              tabIndex={props.order * 4 + 1}
              className={className(
                scoreInputClass,
                resultStatus ? scoreInputStatusClass[resultStatus] : ""
              )}
              value={props.userGoalsRight ?? ""}
              onChange={handleGoalsRightChange}
              disabled={props.disabled}
              onBlur={handleRightInputBlur}
            />
            {showPenaltis && (
              <>
                <div className="penaltis-divider" />
                <input
                  key={`daily-pen-right-${showPenaltis ? "on" : "off"}`}
                  min={0}
                  max={99}
                  type="number"
                  inputMode={"decimal"}
                  tabIndex={props.order * 4 + 3}
                  className={className(
                    penaltisInputClass,
                    penaltisStatus ? scoreInputStatusClass[penaltisStatus] : ""
                  )}
                  value={props.userPenaltisRight ?? ""}
                  onChange={handlePenaltisRightChange}
                  disabled={!userCountryRight || props.disabled}
                  onBlur={handlePenaltisRightInputBlur}
                />
              </>
            )}
          </div>
        </div>
        <div className="text-[14px] text-[#767676] whitespace-nowrap cursor-default text-center flex flex-col items-center gap-[3px]">
          {date}
          {props.filled && (
            <div className="result flex items-center gap-[3px]">
              <span className="mr-[5px] ml-[5px]">{i18n.matchResultLabel}:</span>
              <CountryFlag
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
                code={countryRight?.code}
                tiny
                disabled={(props.goalsLeft || 0) > (props.goalsRight || 0)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right team */}
      <div className="flex items-center flex-1 min-w-0 gap-[6px] justify-end">
        <label
          className="text-[14px] font-bold whitespace-nowrap relative cursor-default group"
          data-tooltip={displayCountryRight?.name}
        >
          {displayCountryRight?.shortName}
          <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-normal whitespace-nowrap px-[7px] py-[3px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            {displayCountryRight?.name}
          </span>
        </label>
        {displayCountryRight && <CountryFlag code={displayCountryRight?.code} />}
      </div>

      {/* Timer strip */}
      <div
        ref={counterRef}
        data-show="false"
        data-timer=""
        data-status=""
        className="daily-match-timer"
      >
        <LockIcon />
      </div>
    </div>
  );
}
