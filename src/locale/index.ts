import React from "react";
import data from "./locale.json";
import countries from "./countries.json";
import { LocaleData } from "./types";

// Default locale for App Router (i18n routing removed)
const DEFAULT_LOCALE = "es";

export function useLocalizedText() {
  return React.useMemo(() => {
    const _data: { [key: string]: LocaleData } = data;
    return {
      ..._data[DEFAULT_LOCALE],
      locale: DEFAULT_LOCALE,
    } as LocaleData & { locale: string };
  }, []);
}

export function useLocalizedCountries() {
  return React.useCallback(
    (code: string, name: string) => {
      return name;
    },
    []
  );
}
