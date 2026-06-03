import { useRouter } from "next/router";
import React from "react";
import data from "./locale.json";
import countries from "./countries.json";
import { LocaleData } from "./types";

export function useLocalizedText() {
  const { locale } = useRouter();

  return React.useMemo(() => {
    const _data: { [key: string]: LocaleData } = data;
    return (
      locale
        ? {
            ..._data[locale],
            locale,
          }
        : { locale }
    ) as LocaleData & { locale: string };
  }, [locale]);
}

export function useLocalizedCountries() {
  const { locale } = useRouter();
  return React.useCallback(
    (code: string, name: string) => {
      if (locale !== "es") {
        //@ts-ignore
        return countries?.[locale]?.[code];
      }
      return name;
    },
    [locale]
  );
}
