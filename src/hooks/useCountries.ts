import { useQuery } from "@tanstack/react-query";
import { useLocalizedCountries } from "../locale";
import { getCountries } from "../utils/api";

export function useCountries() {
  const i18n = useLocalizedCountries();
  const { data: countries } = useQuery({
    // Countries are static — never refetch; keep them cached across navigations
    // so the flags render instantly instead of flickering through a load state.
    staleTime: Infinity,
    gcTime: Infinity,
    queryKey: ["country_list"],
    queryFn: () =>
      getCountries().then((countries) => {
        return countries.map((country) => ({
          ...country,
          name: i18n.long(country.code, country.name),
          shortName: i18n.short(country.code),
        }));
      }),
  });

  return countries;
}
