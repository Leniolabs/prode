import data from "./locale.json";
import countries from "./countries.json";
import { LocaleData } from "./types";

export function localizedText(locale: string) {
  //@ts-ignore
  return data[locale || "es"] as LocaleData;
}

export function localizedCountries(locale: string) {
  return (code: string, name: string) => {
    if (locale && locale !== "es") {
      //@ts-ignore
      return countries?.[locale]?.[code];
    }
    return name;
  };
}
