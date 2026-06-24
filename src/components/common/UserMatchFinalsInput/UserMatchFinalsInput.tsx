import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import { getAdminFinalsMatchWinner } from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";

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

/** Map resultStatus → Tailwind bg classes (border kept at default for penaltis) */
const STATUS_BG: Record<string, string> = {
  GOALS_MATCH: "bg-correct",
  WINNER_MATCH: "bg-winner",
  WRONG: "bg-wrong",
};

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

interface UserMatchFinalsInputProps {
  className?: string;

  disabled?: boolean;
  submissionEndsAt?: Date | string | null;

  userCountryLeftId?: string;
  userGoalsLeft?: number | null;
  userPenaltisLeft?: number | null;

  userCountryRightId?: string;
  userGoalsRight?: number | null;
  userPenaltisRight?: number | null;

  filled?: boolean;

  countryLeftId?: string;
  goalsLeft?: number | null;
  countryRightId?: string;
  goalsRight?: number | null;
  penaltisLeft?: number | null;
  penaltisRight?: number | null;

  date: Date;

  order: number;

  highlight?: boolean;

  showCountryStatus?: boolean;

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

export function UserMatchFinalsInput(
  props: React.PropsWithChildren<UserMatchFinalsInputProps>
) {
  const {
    onChange,
    goalsLeft,
    goalsRight,
    countryLeftId,
    countryRightId,
    userCountryLeftId,
    userCountryRightId,
    userGoalsLeft,
    userGoalsRight,
    filled,
    penaltisLeft,
    penaltisRight,
    userPenaltisLeft,
    userPenaltisRight,
    showCountryStatus,
  } = props;

  const i18n = useLocalizedText();

  const showPenaltis = React.useMemo(() => {
    if (
      (!userGoalsLeft && userGoalsLeft !== 0) ||
      (!userGoalsRight && userGoalsRight !== 0)
    )
      return false;
    return userGoalsLeft === userGoalsRight;
  }, [userGoalsLeft, userGoalsRight]);

  const countryStatus = React.useMemo(() => {
    if (!showCountryStatus) return;
    if (
      !userCountryLeftId ||
      !userCountryRightId ||
      !countryLeftId ||
      !countryRightId
    )
      return;

    if (
      userCountryLeftId === countryLeftId &&
      userCountryRightId === countryRightId
    )
      return "MATCH";

    return "WRONG";
  }, [
    showCountryStatus,
    userCountryLeftId,
    userCountryRightId,
    countryLeftId,
    countryRightId,
  ]);

  const resultStatus = React.useMemo(() => {
    if (countryStatus === "WRONG") return "WRONG";
    return getResultStatus({
      goalsLeft: userGoalsLeft || 0,
      goalsRight: userGoalsRight || 0,
      penaltisLeft: userPenaltisLeft ?? null,
      penaltisRight: userPenaltisRight ?? null,
      match: {
        goalsLeft: goalsLeft ?? null,
        goalsRight: goalsRight ?? null,
        penaltisLeft: penaltisLeft ?? null,
        penaltisRight: penaltisRight ?? null,
      },
    });
  }, [
    countryStatus,
    goalsRight,
    goalsLeft,
    userGoalsRight,
    userGoalsLeft,
    penaltisLeft,
    penaltisRight,
    userPenaltisLeft,
    userPenaltisRight,
  ]);

  const penaltisStatus = React.useMemo(() => {
    if (resultStatus === "WRONG") return "WRONG";

    if (
      (!userPenaltisRight && userPenaltisRight !== 0) ||
      (!userPenaltisLeft && userPenaltisLeft !== 0) ||
      (!penaltisRight && penaltisRight !== 0) ||
      (!penaltisLeft && penaltisLeft !== 0)
    )
      return;

    if (
      userPenaltisRight === penaltisRight &&
      userPenaltisLeft === penaltisLeft
    )
      return "GOALS_MATCH";

    if (
      (userPenaltisRight >= userPenaltisLeft &&
        penaltisRight >= penaltisLeft) ||
      (userPenaltisRight <= userPenaltisLeft && penaltisRight <= penaltisLeft)
    )
      return "WINNER_MATCH";

    return "WRONG";
  }, [
    countryStatus,
    goalsRight,
    goalsLeft,
    userGoalsRight,
    userGoalsLeft,
    penaltisLeft,
    penaltisRight,
    userPenaltisLeft,
    userPenaltisRight,
  ]);

  const countries = useCountries();

  const countryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === countryLeftId);
  }, [countryLeftId, countries]);

  const userCountryLeft = React.useMemo(() => {
    return countries?.find((row) => row.id === userCountryLeftId);
  }, [userCountryLeftId, countries]);

  const countryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === countryRightId);
  }, [countryRightId, countries]);

  const userCountryRight = React.useMemo(() => {
    return countries?.find((row) => row.id === userCountryRightId);
  }, [userCountryRightId, countries]);

  const handleGoalsLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: parseInt(e.target.value, 10),
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userCountryRightId,
      userGoalsRight,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handleGoalsRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: parseInt(e.target.value, 10),
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userCountryRightId,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handleLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (userGoalsLeft ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userGoalsRight,
      userCountryRightId,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handleRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (userGoalsRight ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userGoalsRight,
      userCountryRightId,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handlePenaltisLeftChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: parseInt(e.target.value, 10),
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userCountryRightId,
      userGoalsRight,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handlePenaltisRightChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: parseInt(e.target.value, 10),
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userGoalsRight,
      userCountryRightId,
      userPenaltisLeft,
    ]
  );

  const handlePenaltisLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (userPenaltisLeft ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userGoalsRight,
      userCountryRightId,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const handlePenaltisRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (userPenaltisRight ?? "").toString();
      onChange?.(
        parseResults({
          countryLeftId: userCountryLeftId,
          goalsLeft: userGoalsLeft ?? null,
          countryRightId: userCountryRightId,
          goalsRight: userGoalsRight ?? null,
          penaltisLeft: userPenaltisLeft ?? null,
          penaltisRight: userPenaltisRight ?? null,
        })
      );
    },
    [
      onChange,
      userCountryLeftId,
      userGoalsLeft,
      userGoalsRight,
      userCountryRightId,
      userPenaltisLeft,
      userPenaltisRight,
    ]
  );

  const date = React.useMemo(() => {
    return formatDate(props.date, i18n.locale);
  }, [props.date, i18n.locale]);

  // Fall back to bg-transparent here rather than carrying it in the input's
  // base class: a base `bg-transparent` competes with the status bg at equal
  // specificity and, because Tailwind orders utilities alphabetically,
  // `bg-transparent` outranks `bg-correct` so the green never shows. Picking
  // one bg class keeps the highlight override (!important) winning when set.
  const goalStatusCls = resultStatus ? STATUS_BG[resultStatus] ?? "bg-transparent" : "bg-transparent";
  // The penalty box is now a full second column (90' goals + P penalties),
  // so its default background matches the goal input (transparent). Same
  // alphabetical-ordering trap applies: pick a single bg utility so the status
  // bg is the only one when set.
  const penaltisStatusCls = penaltisStatus
    ? STATUS_BG[penaltisStatus] ?? "bg-transparent"
    : "bg-transparent";

  // Penalties only decide a knockout tie. The column always renders to match
  // the mockup's "90' / P" header pair, but the input is editable only when the
  // user predicts a draw (showPenaltis) and the row is otherwise editable.
  const penaltisDisabled =
    !userCountryLeft || !userCountryRight || props.disabled || !showPenaltis;

  // highlight border/bg override: when highlight, inputs and countryInput use teal border + teal bg
  const highlightInputCls = props.highlight
    ? "!border-[#4db4b2] !bg-[#4db4b230]"
    : "";
  const highlightCountryCls = props.highlight
    ? "!border-[#4db4b2] !bg-[#4db4b230]"
    : "";

  const renderGoalsInput = (
    side: "left" | "right",
    tabOffset: number,
    testId: string,
    value: number | null | undefined,
    onChangeFn: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onBlurFn: (e: React.FocusEvent<HTMLInputElement>) => void,
    isDisabled: boolean
  ) => (
    <input
      type="number"
      inputMode={"decimal"}
      tabIndex={props.order * 4 + tabOffset}
      data-testid={testId}
      className={className(
        "match-input-number",
        "w-[30px] h-[30px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] text-[17px] p-[6px]",
        "disabled:opacity-80",
        goalStatusCls,
        highlightInputCls
      )}
      defaultValue={value ?? ""}
      onChange={onChangeFn}
      disabled={isDisabled}
      onBlur={onBlurFn}
    />
  );

  const renderPenaltisInput = (
    tabOffset: number,
    testId: string,
    value: number | null | undefined,
    onChangeFn: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onBlurFn: (e: React.FocusEvent<HTMLInputElement>) => void
  ) => (
    <input
      key={`${testId}-${showPenaltis ? "on" : "off"}`}
      type="number"
      inputMode={"decimal"}
      tabIndex={props.order * 4 + tabOffset}
      data-testid={testId}
      className={className(
        "match-input-number",
        "w-[30px] h-[30px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] text-[17px] p-[6px]",
        "disabled:opacity-80",
        penaltisStatusCls,
        highlightInputCls
      )}
      defaultValue={value ?? ""}
      onChange={onChangeFn}
      disabled={penaltisDisabled}
      onBlur={onBlurFn}
    />
  );

  return (
    <div
      className={className(
        props.className,
        "flex flex-col relative text-[16px]",
        "bg-[var(--finals-card-bg,#f6f5f5)] rounded-[8px] p-[6px_8px]",
        // on mobile/tablet add bottom margin
        "max-[1024px]:mb-6"
      )}
      style={{ order: props.order }}
    >
      {/* Header row: kickoff date (left) + "90' / P" column headers above the
          two input columns (right). */}
      <div className="flex items-end mb-[6px]">
        <span className="flex-1 min-w-0 text-[13px] font-bold text-brand-blue truncate">
          {date}
        </span>
        <div className="flex shrink-0 gap-[6px] text-[11px] font-semibold text-[#767676] leading-none">
          <span className="w-[30px] text-center">{"90'"}</span>
          <span className="w-[30px] text-center">P</span>
        </div>
      </div>

      {/* Left country row */}
      <div className="flex relative mb-[6px]">
        <div
          className={className(
            "py-[5px] px-[2px] w-full h-[34px] flex items-center rounded-[4px]",
            highlightCountryCls
          )}
        >
          {userCountryLeft?.code && (
            <CountryFlag
              className="[&_img]:w-[28px] [&_img]:h-[20px] [&_img]:rounded-[2px] [&_img]:object-cover"
              code={userCountryLeft?.code}
            />
          )}
          <label className="ml-[6px] text-[14px] whitespace-nowrap relative cursor-default group">
            {userCountryLeft?.shortName}
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
              {userCountryLeft?.name}
            </span>
          </label>
        </div>
        <div className="ml-[6px] flex shrink-0 gap-[6px] items-start">
          {renderGoalsInput(
            "left",
            0,
            "finals-match-goals-left",
            props.userGoalsLeft,
            handleGoalsLeftChange,
            handleLeftInputBlur,
            !userCountryLeft || !userCountryRight || !!props.disabled
          )}
          {renderPenaltisInput(
            2,
            "finals-match-penalties-left",
            props.userPenaltisLeft,
            handlePenaltisLeftChange,
            handlePenaltisLeftInputBlur
          )}
        </div>
      </div>

      {/* Right country row */}
      <div className="flex relative mb-[6px]">
        <div
          className={className(
            "py-[5px] px-[2px] w-full h-[34px] flex items-center rounded-[4px]",
            highlightCountryCls
          )}
        >
          {userCountryRight?.code && (
            <CountryFlag
              className="[&_img]:w-[28px] [&_img]:h-[20px] [&_img]:rounded-[2px] [&_img]:object-cover"
              code={userCountryRight?.code}
            />
          )}
          <label className="ml-[6px] text-[14px] whitespace-nowrap relative cursor-default group">
            {userCountryRight?.shortName}
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
              {userCountryRight?.name}
            </span>
          </label>
        </div>
        <div className="ml-[6px] flex shrink-0 gap-[6px] items-start">
          {renderGoalsInput(
            "right",
            1,
            "finals-match-goals-right",
            props.userGoalsRight,
            handleGoalsRightChange,
            handleRightInputBlur,
            !userCountryRight || !!props.disabled
          )}
          {renderPenaltisInput(
            3,
            "finals-match-penalties-right",
            props.userPenaltisRight,
            handlePenaltisRightChange,
            handlePenaltisRightInputBlur
          )}
        </div>
      </div>

      {/* Result row (actual score), shown once the match is played. */}
      {filled && (
        <div className="text-[14px] text-[#767676] flex items-center">
          <span className="mr-[5px]">Resultado:</span>
          <CountryFlag
            className="mr-[3px]"
            code={countryLeft?.code}
            tiny
            disabled={getAdminFinalsMatchWinner(props) !== countryLeft?.id}
          />
          {goalsLeft}
          {"-"}
          {goalsRight}{" "}
          {goalsRight === goalsLeft && (
            <>
              {"("}
              {penaltisLeft}
              {"-"}
              {penaltisRight}
              {")"}
            </>
          )}
          <CountryFlag
            className="ml-[3px]"
            code={countryRight?.code}
            tiny
            disabled={getAdminFinalsMatchWinner(props) !== countryRight?.id}
          />
        </div>
      )}
    </div>
  );
}
