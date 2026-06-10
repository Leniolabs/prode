"use client";

import { useLocale, useSetLocale } from "@/locale";
import { SUPPORTED_LOCALES } from "@/locale/shared";
import { className } from "@/utils/classname";

interface LocaleSelectProps {}

// Cookie-based locale switcher. Writes the locale cookie via the LocaleProvider
// and refreshes so server-rendered parts follow. URLs are unchanged.
export function LocaleSelect(props: LocaleSelectProps) {
  const current = useLocale();
  const setLocale = useSetLocale();

  return (
    <div className="flex text-white select-none">
      {SUPPORTED_LOCALES.map((locale, i, arr) => (
        <div key={locale}>
          <a
            role="button"
            className={className(
              "text-white p-1 cursor-pointer",
              locale === current ? "bg-[#00000033]" : "hover:bg-[#00000033]"
            )}
            onClick={() => setLocale(locale)}
          >
            {locale.toLocaleUpperCase()}
          </a>
          <span className="text-white p-1">{arr.length > i + 1 ? "|" : ""}</span>
        </div>
      ))}
    </div>
  );
}
