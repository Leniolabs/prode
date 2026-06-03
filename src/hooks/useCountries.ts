import { useQuery } from "react-query";
import { useLocalizedCountries } from "../locale";
import { getCountries } from "../utils/api";

export function useCountries() {
  const i18n = useLocalizedCountries();
  const { data: countries } = useQuery(["country_list"], () =>
    getCountries().then((countries) => {
      return countries.map((country) => ({
        ...country,
        name: i18n(country.code, country.name),
      }));
    })
  );

  return countries;
}
