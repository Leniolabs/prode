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
  // Same alphabetical-ordering trap as the goal inputs, but the penalty badge's
  // default background is bg-white on desktop (a readable badge over the goal
  // input) and transparent on mobile. Carry that default here so the status bg
  // is the only background utility when a status is set.
  const penaltisDefaultBg = "bg-white max-[1024px]:bg-transparent";
  const penaltisStatusCls = penaltisStatus
    ? STATUS_BG[penaltisStatus] ?? penaltisDefaultBg
    : penaltisDefaultBg;

  // highlight border/bg override: when highlight, inputs and countryInput use teal border + teal bg
  const highlightInputCls = props.highlight
    ? "!border-[#4db4b2] !bg-[#4db4b230]"
    : "";
  const highlightCountryCls = props.highlight
    ? "!border-[#4db4b2] !bg-[#4db4b230]"
    : "";

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
              className="[&_img]:w-[28px] [&_img]:h-[20px]"
              code={userCountryLeft?.code}
            />
          )}
          <label className="ml-[6px] text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
            {userCountryLeft?.name}
          </label>
        </div>
        {/* Goals (+ corner penalties) group — relative so the penalty input
            anchors to the goals input's bottom-right corner on desktop. */}
        <div className="relative ml-[6px] flex shrink-0 items-start">
          <input
            type="number"
            inputMode={"decimal"}
            tabIndex={props.order * 4}
            data-testid="finals-match-goals-left"
            className={className(
              "match-input-number",
              "w-[30px] h-[30px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] text-[17px] p-[6px]",
              "disabled:opacity-80",
              goalStatusCls,
              highlightInputCls,
              showPenaltis && "max-[1024px]:text-center max-[1024px]:border-r-0"
            )}
            defaultValue={props.userGoalsLeft ?? ""}
            onChange={handleGoalsLeftChange}
            disabled={!userCountryLeft || !userCountryRight || props.disabled}
            onBlur={handleLeftInputBlur}
          />
          {showPenaltis && (
            <>
              {/* Divider: hidden on desktop, visible on <=1024 */}
              <div className="hidden max-[1024px]:block relative border-l border-[#233042cc] mt-[7px] h-[20px] z-[1] -left-[0.5px]" />
              {/* Penalties input — desktop: badge in the goals bottom-right
                  corner; <=1024: joined to the right of the goal input */}
              <input
                type="number"
                inputMode={"decimal"}
                tabIndex={props.order * 4 + 2}
                data-testid="finals-match-penalties-left"
                className={className(
                  "match-input-number",
                  "text-[10px] absolute right-0 bottom-0 h-[16px] w-[16px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] disabled:opacity-80",
                  "max-[1024px]:relative max-[1024px]:text-[14px] max-[1024px]:h-[34px] max-[1024px]:w-[34px] max-[1024px]:-ml-[1px] max-[1024px]:border-l-0 max-[1024px]:bottom-auto max-[1024px]:right-auto",
                  penaltisStatusCls,
                  highlightInputCls
                )}
                defaultValue={props.userPenaltisLeft ?? ""}
                onChange={handlePenaltisLeftChange}
                disabled={!userCountryLeft || !userCountryRight || props.disabled}
                onBlur={handlePenaltisLeftInputBlur}
              />
            </>
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
              className="[&_img]:w-[28px] [&_img]:h-[20px]"
              code={userCountryRight?.code}
            />
          )}
          <label className="ml-[6px] text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
            {userCountryRight?.name}
          </label>
        </div>
        {/* Goals (+ corner penalties) group */}
        <div className="relative ml-[6px] flex shrink-0 items-start">
          <input
            type="number"
            inputMode={"decimal"}
            tabIndex={props.order * 4 + 1}
            data-testid="finals-match-goals-right"
            className={className(
              "match-input-number",
              "w-[30px] h-[30px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] text-[17px] p-[6px]",
              "disabled:opacity-80",
              goalStatusCls,
              highlightInputCls,
              showPenaltis && "max-[1024px]:text-center max-[1024px]:border-r-0"
            )}
            defaultValue={props.userGoalsRight ?? ""}
            onChange={handleGoalsRightChange}
            disabled={!userCountryRight || props.disabled}
            onBlur={handleRightInputBlur}
          />
          {showPenaltis && (
            <>
              <div className="hidden max-[1024px]:block relative border-l border-[#233042cc] mt-[7px] h-[20px] z-[1] -left-[0.5px]" />
              <input
                type="number"
                inputMode={"decimal"}
                tabIndex={props.order * 4 + 3}
                data-testid="finals-match-penalties-right"
                className={className(
                  "match-input-number",
                  "text-[10px] absolute right-0 bottom-0 h-[16px] w-[16px] rounded-[2px] border border-[#a7a8a9] outline-none text-center text-[#233042] disabled:opacity-80",
                  "max-[1024px]:relative max-[1024px]:text-[14px] max-[1024px]:h-[34px] max-[1024px]:w-[34px] max-[1024px]:-ml-[1px] max-[1024px]:border-l-0 max-[1024px]:bottom-auto max-[1024px]:right-auto",
                  penaltisStatusCls,
                  highlightInputCls
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

      {/* Date / result row */}
      {filled ? (
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
      ) : (
        <div className="text-[14px] text-[#767676] flex items-center">{date}</div>
      )}
    </div>
  );
}
