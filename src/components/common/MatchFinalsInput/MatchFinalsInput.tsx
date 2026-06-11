import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import { CountryFlag } from "../CountryFlag";
import { CountrySelect } from "../CountrySelect";

// Suppress webkit/firefox number-input spinners (idempotent).
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

// Shared input classes for goal/penalty inputs in the finals card
const GOALS_INPUT_CLS =
  "match-input-number ml-[6px] w-[34px] h-full border border-[#233042] bg-transparent outline-none text-center text-[#233042] p-[6px] disabled:opacity-80";

const PENALTIS_INPUT_CLS =
  "match-input-number text-[10px] absolute right-0 bottom-0 h-[16px] w-[16px] border border-[#233042] bg-transparent outline-none text-center text-[#233042] disabled:opacity-80";

function MatchFinalsInputComponent(
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
      className={className(props.className, "flex flex-col relative text-[16px]")}
      style={{ order: props.order }}
    >
      {/* Left country row */}
      <div className="flex mb-[6px] relative">
        {props.countryInput && (
          <CountrySelect
            id={props.countryLeftId}
            onChange={handleCountryLeftChange}
          />
        )}
        {!props.countryInput && (
          <div className="p-[2px] w-full h-[34px] flex items-center border border-[#233042]">
            {countryLeft?.code && (
              <CountryFlag
                className="[&_img]:w-[27px] [&_img]:h-[27px]"
                code={countryLeft?.code}
              />
            )}
            <label className="ml-1">{countryLeft?.name}</label>
          </div>
        )}
        <input
          type="number"
          inputMode={"decimal"}
          data-testid="finals-match-goals-left"
          className={GOALS_INPUT_CLS}
          defaultValue={props.goalsLeft}
          onChange={handleGoalsLeftChange}
          disabled={props.disabled}
          onBlur={handleLeftInputBlur}
        />
        {showPenaltis && (
          <input
            type="number"
            inputMode={"decimal"}
            data-testid="finals-match-penalties-left"
            className={PENALTIS_INPUT_CLS}
            defaultValue={props.penaltisLeft ?? ""}
            onChange={handlePenaltisLeftChange}
            disabled={props.disabled}
            onBlur={handlePenaltisLeftInputBlur}
          />
        )}
      </div>

      {/* Right country row */}
      <div className="flex mb-[6px] relative">
        {props.countryInput && (
          <CountrySelect
            id={props.countryRightId}
            onChange={handleCountryRightChange}
          />
        )}
        {!props.countryInput && (
          <div className="p-[2px] w-full h-[34px] flex items-center border border-[#233042]">
            {countryRight?.code && (
              <CountryFlag
                className="[&_img]:w-[27px] [&_img]:h-[27px]"
                code={countryRight?.code}
              />
            )}
            <label className="ml-1">{countryRight?.name}</label>
          </div>
        )}
        <input
          type="number"
          inputMode={"decimal"}
          data-testid="finals-match-goals-right"
          className={GOALS_INPUT_CLS}
          defaultValue={props.goalsRight}
          onChange={handleGoalsRightChange}
          disabled={props.disabled}
          onBlur={handleRightInputBlur}
        />
        {showPenaltis && (
          <input
            type="number"
            inputMode={"decimal"}
            data-testid="finals-match-penalties-right"
            className={PENALTIS_INPUT_CLS}
            defaultValue={props.penaltisRight ?? ""}
            onChange={handlePenaltisRightChange}
            disabled={props.disabled}
            onBlur={handlePenaltisRightInputBlur}
          />
        )}
      </div>

      <div className="text-[14px] text-[#233042]">{date}</div>
    </div>
  );
}

// Memoized: a bracket renders dozens of these (each with a Radix country
// select), so without this every keystroke re-renders the whole tree. onChange
// is intentionally excluded from the comparison — callers use functional
// setState, so a stable-by-value closure is safe and lets unchanged matches
// skip re-render. Date is compared by time, not reference.
export const MatchFinalsInput = React.memo(
  MatchFinalsInputComponent,
  (prev, next) =>
    prev.className === next.className &&
    prev.disabled === next.disabled &&
    prev.countryLeftId === next.countryLeftId &&
    prev.countryRightId === next.countryRightId &&
    prev.goalsLeft === next.goalsLeft &&
    prev.goalsRight === next.goalsRight &&
    prev.penaltisLeft === next.penaltisLeft &&
    prev.penaltisRight === next.penaltisRight &&
    prev.order === next.order &&
    prev.countryInput === next.countryInput &&
    +prev.date === +next.date
);
