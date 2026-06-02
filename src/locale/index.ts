import React from "react";
import data from "./locale.json";
import countries from "./countries.json";
import { LocaleData } from "./types";

const SUPPORTED_LOCALES = ["es", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function getLocale(): SupportedLocale {
  if (typeof window === "undefined") return "es";
  const lang = (navigator.language || "es").toLowerCase();
  if (lang.startsWith("en")) return "en";
  return "es";
}

function useLocale(): SupportedLocale {
  return React.useMemo(() => getLocale(), []);
}

export function useLocalizedText() {
  const locale = useLocale();

  return React.useMemo(() => {
    const _data: { [key: string]: LocaleData } = data;
    return {
      ..._data[locale],
      locale,
    } as LocaleData & { locale: string };
  }, [locale]);
}

export function useLocalizedCountries() {
  const locale = useLocale();
  return React.useCallback(
    (code: string, name: string) => {
      if (locale !== "es") {
        // @ts-expect-error countries JSON is not fully typed
        return countries?.[locale]?.[code];
      }
      return name;
    },
    [locale]
  );
}
