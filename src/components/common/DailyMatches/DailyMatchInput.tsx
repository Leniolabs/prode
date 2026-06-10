import React from "react";
import { useCountries } from "../../../hooks";
import { useInterval } from "../../../hooks/useInterval";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate, formatHour } from "../../../utils/date";
import { matchResultStatus } from "../../../utils/points";
import { ButtonIcon } from "../ButtonIcon";
import { CountryFlag } from "../CountryFlag";
import { EditIcon, LockIcon } from "../Icons";

interface DailyMatchInputProps {
  className?: string;

  disabled?: boolean;
  submissionEndsAt?: Date | string | null;

  countryLeftId: string;
  goalsLeft?: number | null;
  userGoalsLeft?: number | null;

  countryRightId: string;
  goalsRight?: number | null;
  userGoalsRight?: number | null;

  date: Date;

  filled?: boolean;

  today?: boolean;
  onEditResult?: () => void;

  onChange?: (goalsLeft: number | null, goalsRight: number | null) => void;
}

const scoreInputClass =
  "text-[20px] bg-transparent w-10 h-10 outline-none text-black text-center border border-[#767676] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-80";

const scoreInputStatusClass: Record<string, string> = {
  GOALS_MATCH: "!bg-[#309e3a] !border-[#309e3a]",
  WINNER_MATCH: "!bg-[#0093dd] !border-[#0093dd]",
  WRONG: "!bg-[#f9aa51] !border-[#f9aa51]",
};

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

  const submissionEndsAt = React.useMemo(() => {
    return props.submissionEndsAt ? new Date(props.submissionEndsAt) : null;
  }, [props.submissionEndsAt]);

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
        "[&_+_&]:border-t [&_+_&]:border-[#767676]"
      )}
    >
      {/* Left team */}
      <div className="flex items-center flex-1 min-w-0 gap-[6px]">
        <CountryFlag code={countryLeft?.code} />
        <label
          className="text-[14px] font-bold whitespace-nowrap relative cursor-default group"
          data-tooltip={countryLeft?.name}
        >
          {countryLeft?.shortName}
          <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-normal whitespace-nowrap px-[7px] py-[3px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            {countryLeft?.name}
          </span>
        </label>
      </div>

      {/* Center */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="flex">
          <div>
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              className={className(
                scoreInputClass,
                resultStatus ? scoreInputStatusClass[resultStatus] : ""
              )}
              defaultValue={
                props.userGoalsLeft != null &&
                !Number.isNaN(props.userGoalsLeft)
                  ? props.userGoalsLeft
                  : ""
              }
              onChange={handleLeftGoalsChange}
              disabled={props.disabled}
              onBlur={handleLeftInputBlur}
            />
          </div>
          <div className="ml-[6px]">
            <input
              type="number"
              min={0}
              max={99}
              inputMode={"decimal"}
              className={className(
                scoreInputClass,
                resultStatus ? scoreInputStatusClass[resultStatus] : ""
              )}
              defaultValue={
                props.userGoalsRight != null &&
                !Number.isNaN(props.userGoalsRight)
                  ? props.userGoalsRight
                  : ""
              }
              onChange={handleRightGoalsChange}
              disabled={props.disabled}
              onBlur={handleRightInputBlur}
            />
          </div>
        </div>
        <div className="text-[14px] text-[#767676] whitespace-nowrap cursor-default text-center flex flex-col items-center gap-[3px]">
          {date}
          {props.onEditResult && !props.filled && (
            <ButtonIcon
              className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] max-w-[18px] max-h-[18px] ml-1 p-0 text-[#767676] hover:bg-black/[0.08] [&_svg]:w-[14px] [&_svg]:h-[14px] [&_path]:stroke-current"
              onClick={props.onEditResult}
            >
              <EditIcon />
            </ButtonIcon>
          )}
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
              <CountryFlag
                code={countryRight?.code}
                tiny
                disabled={(props.goalsLeft || 0) > (props.goalsRight || 0)}
              />
              {props.onEditResult && (
                <ButtonIcon
                  className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] max-w-[18px] max-h-[18px] ml-1 p-0 text-[#767676] hover:bg-black/[0.08] [&_svg]:w-[14px] [&_svg]:h-[14px] [&_path]:stroke-current"
                  onClick={props.onEditResult}
                >
                  <EditIcon />
                </ButtonIcon>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right team */}
      <div className="flex items-center flex-1 min-w-0 gap-[6px] justify-end">
        <label
          className="text-[14px] font-bold whitespace-nowrap relative cursor-default group"
          data-tooltip={countryRight?.name}
        >
          {countryRight?.shortName}
          <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-normal whitespace-nowrap px-[7px] py-[3px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            {countryRight?.name}
          </span>
        </label>
        <CountryFlag code={countryRight?.code} />
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
