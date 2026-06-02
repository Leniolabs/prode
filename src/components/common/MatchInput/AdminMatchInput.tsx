import React from "react";
import { useCountries } from "../../../hooks";
import { useLocalizedText } from "../../../locale";
import { className } from "../../../utils/classname";
import { formatDate } from "../../../utils/date";
import { matchResultStatus } from "../../../utils/points";
import { CountryFlag } from "../CountryFlag";


interface AdminMatchInputProps {
  className?: string;

  disabled?: boolean;

  countryLeftId: string;
  goalsLeft?: number | null;

  countryRightId: string;
  goalsRight?: number | null;

  date: Date;

  onChange?: (goalsLeft: number | null, goalsRight: number | null) => void;
}

export function AdminMatchInput(
  props: React.PropsWithChildren<AdminMatchInputProps>
) {
  const i18n = useLocalizedText();
  const countries = useCountries();

  const leftCountry = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryLeftId);
  }, [props.countryLeftId, countries]);

  const rightCountry = React.useMemo(() => {
    return countries?.find((row) => row.id === props.countryRightId);
  }, [props.countryRightId, countries]);

  const handleLeftGoalsChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(parseInt(e.target.value, 10), props.goalsRight ?? null);
    },
    [props.onChange, props.goalsRight]
  );

  const handleRightGoalsChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(props.goalsLeft ?? null, parseInt(e.target.value, 10));
    },
    [props.onChange, props.goalsLeft]
  );

  const handleLeftInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.goalsLeft ?? "").toString();
      props.onChange?.(props.goalsLeft ?? null, props.goalsRight ?? null);
    },
    [props.goalsLeft, props.goalsRight]
  );

  const handleRightInputBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.value = (props.goalsRight ?? "").toString();
      props.onChange?.(props.goalsLeft ?? null, props.goalsRight ?? null);
    },
    [props.goalsLeft, props.goalsRight]
  );

  const date = React.useMemo(() => {
    return formatDate(props.date, i18n.locale);
  }, [props.date, i18n.locale]);

  return (
    <div className={className(props.className, 'mi-matchInput')}>
      <CountryFlag code={leftCountry?.code} />
      <label>{leftCountry?.name}</label>
      <div className={'mi-centerContainer'}>
        <div className={'mi-inputsContainer'}>
          <input
            type="number"
            inputMode={"decimal"}
            className={className('mi-leftGoals')}
            defaultValue={props.goalsLeft ?? ""}
            onChange={handleLeftGoalsChange}
            disabled={props.disabled}
            onBlur={handleLeftInputBlur}
          />
          <input
            type="number"
            inputMode={"decimal"}
            className={className('mi-rightGoals')}
            defaultValue={props.goalsRight ?? ""}
            onChange={handleRightGoalsChange}
            disabled={props.disabled}
            onBlur={handleRightInputBlur}
          />
        </div>
        <div className={'mi-date'}>{date}</div>
      </div>
      <label>{rightCountry?.name}</label>
      <CountryFlag code={rightCountry?.code} />
    </div>
  );
}
