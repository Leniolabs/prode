import React from "react";
import { useCountries } from "../../../hooks";
import { className } from "../../../utils/classname";
import { CountryFlag } from "../CountryFlag";
import styles from "./CountrySelect.module.scss";

interface CountrySelectProps {
  id?: string;
  onChange?: (id?: string) => void;
}

export function CountrySelect(props: CountrySelectProps) {
  const countries = useCountries();

  const [open, setOpen] = React.useState(false);

  const selectedCountry = React.useMemo(() => {
    return countries?.find((row) => row.id === props.id);
  }, [countries, props.id]);

  const handleClick = React.useCallback(() => {
    setOpen((open) => !open);
  }, []);

  const handleCountryClick = React.useCallback(
    (id?: string) => {
      return (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        props.onChange?.(id);
        setOpen(false);
      };
    },
    [props.onChange]
  );

  return (
    <div
      className={className(styles.countrySelect, open && styles.open)}
      onClick={handleClick}
    >
      <div className={styles.countryLabel}>
        <CountryFlag code={selectedCountry?.code} />
        <label>{selectedCountry?.name}</label>
      </div>
      <div className={styles.countrySelectDropdown}>
        {[{ code: null, id: undefined, name: "None" }, ...(countries || [])].map(
          (country) => (
            <div
              key={country.id}
              className={styles.countryLabel}
              onClick={handleCountryClick(country.id)}
            >
              {country.code && <CountryFlag code={country.code} />}
              <label>{country.name}</label>
            </div>
          )
        )}
      </div>
    </div>
  );
}
