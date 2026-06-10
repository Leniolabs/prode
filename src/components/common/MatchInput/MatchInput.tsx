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
import { ButtonIcon } from "../ButtonIcon";
import { CountryFlag } from "../CountryFlag";
import { EditIcon } from "../Icons";

// Spinner-removal utility injected once at module load.
// We need to suppress the webkit/firefox number-input spinners globally
// for these inputs. A tiny <style> tag is the cleanest approach in Tailwind 4
// since there is no utility for -webkit-appearance on pseudo-elements.
const INPUT_STYLE_ID = "match-input-no-spinner";
if (typeof document !== "undefined" && !document.getElementById(INPUT_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = INPUT_STYLE_ID;
  s.textContent = `
    .match-input-number::-webkit-outer-spin-button,
    .match-input-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .match-input-number[type=number] { -moz-appearance: textfield; }
  `;
  document.head.appendChild(s);
}

/** Map resultStatus → Tailwind bg+border classes */
const STATUS_CLASSES: Record<string, string> = {
  GOALS_MATCH: "bg-correct border-correct",
  WINNER_MATCH: "bg-winner border-winner",
  WRONG: "bg-wrong border-wrong",
};

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
  onEditResult?: () => void;

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

  const inputStatusCls = resultStatus ? STATUS_CLASSES[resultStatus] ?? "" : "";

  return (
    <div
      className={className(
        props.className,
        "flex items-center h-[52px] px-2 gap-1"
      )}
    >
      {/* Left team — flex:1 + min-w-0 prevents overflow */}
      <div className="flex items-center flex-1 min-w-0 gap-1">
        <CountryFlag code={countryLeft?.code} />
        {/* Label with desktop-only tooltip via a hidden span */}
        <label className="text-[14px] whitespace-nowrap relative cursor-default group">
          {countryLeft?.shortName}
          {/* Tooltip: hidden on mobile/touch, shown on hover on desktop */}
          <span
            className={className(
              "pointer-events-none absolute left-1/2 -translate-x-1/2 z-10",
              "bottom-[calc(100%+6px)]",
              "bg-black/85 text-white text-[11px] whitespace-nowrap px-[7px] py-[3px] rounded-[4px]",
              "opacity-0 transition-opacity duration-150",
              // hide completely on touch/narrow screens (no phantom width)
              "max-[640px]:hidden",
              // show on hover on hover-capable devices
              "[@media(hover:hover)]:group-hover:opacity-100"
            )}
          >
            {countryLeft?.name}
          </span>
        </label>
      </div>

      {/* Center — flex-shrink:0 so it never collapses */}
      <div className="flex-none flex flex-col items-center">
        <div className="flex">
          <input
            min={0}
            max={99}
            type="number"
            inputMode={"decimal"}
            data-testid="group-match-goals-left"
            className={className(
              "match-input-number",
              "text-[17px] bg-transparent max-w-[30px] outline-none text-black text-center border border-neutral-gray",
              "disabled:opacity-80",
              inputStatusCls
            )}
            value={props.userGoalsLeft != null && !Number.isNaN(props.userGoalsLeft) ? props.userGoalsLeft : ""}
            onChange={handleLeftGoalsChange}
            disabled={props.disabled}
            onBlur={handleLeftInputBlur}
          />
          <input
            min={0}
            max={99}
            type="number"
            inputMode={"decimal"}
            data-testid="group-match-goals-right"
            className={className(
              "match-input-number",
              "text-[17px] bg-transparent max-w-[30px] outline-none text-black text-center border border-neutral-gray ml-[6px]",
              "disabled:opacity-80",
              inputStatusCls
            )}
            value={props.userGoalsRight != null && !Number.isNaN(props.userGoalsRight) ? props.userGoalsRight : ""}
            onChange={handleRightGoalsChange}
            disabled={props.disabled}
            onBlur={handleRightInputBlur}
          />
        </div>
        {props.filled ? (
          <div className="flex items-center gap-[3px] text-[13px] text-neutral-gray whitespace-nowrap cursor-default mt-1">
            <span className="mr-[5px]">Resultado:</span>
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
        ) : (
          <div className="flex items-center gap-[3px] text-[13px] text-neutral-gray whitespace-nowrap cursor-default">
            {date}
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

      {/* Right team — flex:1 + min-w-0 + justify-end */}
      <div className="flex items-center justify-end flex-1 min-w-0 gap-1">
        {/* Label with desktop-only tooltip */}
        <label className="text-[14px] whitespace-nowrap relative cursor-default group">
          {countryRight?.shortName}
          <span
            className={className(
              "pointer-events-none absolute left-1/2 -translate-x-1/2 z-10",
              "bottom-[calc(100%+6px)]",
              "bg-black/85 text-white text-[11px] whitespace-nowrap px-[7px] py-[3px] rounded-[4px]",
              "opacity-0 transition-opacity duration-150",
              "max-[640px]:hidden",
              "[@media(hover:hover)]:group-hover:opacity-100"
            )}
          >
            {countryRight?.name}
          </span>
        </label>
        <CountryFlag code={countryRight?.code} />
      </div>
    </div>
  );
}
