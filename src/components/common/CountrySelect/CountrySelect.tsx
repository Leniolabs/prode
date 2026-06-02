import React from "react";
import { useCountries } from "../../../hooks";
import { className } from "../../../utils/classname";
import { CountryFlag } from "../CountryFlag";

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
      className="cursor-pointer h-full relative w-full border border-[#233042] h-[34px]"
      onClick={handleClick}
    >
      <div className="p-0.5 flex items-center [&_label]:cursor-pointer [&_label]:ml-1">
        <CountryFlag code={selectedCountry?.code} />
        <label>{selectedCountry?.name}</label>
      </div>
      {open && (
        <div className="absolute top-full bg-[#f6f5f5cc] z-[100000] w-full max-h-[300px] overflow-y-scroll">
          {[{ code: null, id: undefined, name: "None" }, ...(countries || [])].map(
            (country) => (
              <div
                key={country.id}
                className="p-0.5 flex items-center [&_label]:cursor-pointer [&_label]:ml-1 hover:bg-[#f6f5f5dd]"
                onClick={handleCountryClick(country.id)}
              >
                {country.code && <CountryFlag code={country.code} />}
                <label>{country.name}</label>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
