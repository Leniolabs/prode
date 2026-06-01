import { useQuery } from "@tanstack/react-query";
import { useLocalizedCountries } from "../locale";
import { getCountries } from "../utils/api";

export function useCountries() {
  const i18n = useLocalizedCountries();
  const { data: countries } = useQuery({
    queryKey: ["country_list"],
    queryFn: () =>
      getCountries().then((countries) => {
        return countries.map((country) => ({
          ...country,
          name: i18n(country.code, country.name),
        }));
      }),
  });

  return countries;
}
