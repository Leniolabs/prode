import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import { getAdminFinalsMatchWinner } from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";


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

  return (
    <div
      className={className(
        props.className,
        'umfi-matchFinalsInput',
        props.highlight && 'umfi-highlight'
      )}
      style={{ order: props.order }}
    >
      <div className={'umfi-countryRow'}>
        <div
          className={className(
            'umfi-countryInput',
            // countryStatus && countryStatus
          )}
        >
          {userCountryLeft?.code && (
            <CountryFlag
              className={'umfi-countryFlag'}
              code={userCountryLeft?.code}
            />
          )}
          <label>{userCountryLeft?.name}</label>
        </div>
        <input
          type="number"
          inputMode={"decimal"}
          tabIndex={props.order * 4}
          className={className(
            'umfi-goalsLeft',
            resultStatus && resultStatus
          )}
          defaultValue={props.userGoalsLeft ?? ""}
          onChange={handleGoalsLeftChange}
          disabled={!userCountryLeft || !userCountryRight || props.disabled}
          onBlur={handleLeftInputBlur}
        />
        {showPenaltis && (
          <>
            <div className={'umfi-penaltisDivider'} />
            <input
              type="number"
              inputMode={"decimal"}
              tabIndex={props.order * 4 + 2}
              className={className(
                'umfi-penaltisLeft',
                penaltisStatus && penaltisStatus
              )}
              defaultValue={props.userPenaltisLeft ?? ""}
              onChange={handlePenaltisLeftChange}
              disabled={!userCountryLeft || !userCountryRight || props.disabled}
              onBlur={handlePenaltisLeftInputBlur}
            />
          </>
        )}
      </div>
      <div className={'umfi-countryRow'}>
        <div
          className={className(
            'umfi-countryInput',
            // countryStatus && countryStatus
          )}
        >
          {userCountryRight?.code && (
            <CountryFlag
              className={'umfi-countryFlag'}
              code={userCountryRight?.code}
            />
          )}
          <label>{userCountryRight?.name}</label>
        </div>
        <input
          type="number"
          inputMode={"decimal"}
          tabIndex={props.order * 4 + 1}
          className={className(
            'umfi-goalsRight',
            resultStatus && resultStatus
          )}
          defaultValue={props.userGoalsRight ?? ""}
          onChange={handleGoalsRightChange}
          disabled={!userCountryRight || props.disabled}
          onBlur={handleRightInputBlur}
        />
        {showPenaltis && (
          <>
            <div className={'umfi-penaltisDivider'} />
            <input
              type="number"
              inputMode={"decimal"}
              tabIndex={props.order * 4 + 3}
              className={className(
                'umfi-penaltisRight',
                penaltisStatus && penaltisStatus
              )}
              defaultValue={props.userPenaltisRight ?? ""}
              onChange={handlePenaltisRightChange}
              disabled={!userCountryRight || props.disabled}
              onBlur={handlePenaltisRightInputBlur}
            />
          </>
        )}
      </div>
      {filled ? (
        <>
          <div className={'umfi-date'}>
            <span>Resultado:</span>
            <CountryFlag
              className={'umfi-countryFlag'}
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
              className={'umfi-countryFlag'}
              code={countryRight?.code}
              tiny
              disabled={getAdminFinalsMatchWinner(props) !== countryRight?.id}
            />
          </div>
        </>
      ) : (
        <div className={'umfi-date'}>{date}</div>
      )}
    </div>
  );
}
