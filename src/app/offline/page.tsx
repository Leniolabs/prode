import type { Metadata } from "next";
import localeData from "@/locale/locale.json";
import { cookies } from "next/headers";
import { isSupportedLocale, LOCALE_COOKIE } from "@/locale/shared";
import { OfflineContent } from "./OfflineContent";

type OfflineLocale = "es" | "en";

const offlineLocaleData = localeData as Record<
  OfflineLocale,
  {
    offlineMetaTitle: string;
    offlineDescription: string;
  }
>;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: OfflineLocale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : "es";

  return {
    title: `${offlineLocaleData[locale].offlineMetaTitle} | Prode`,
    description: offlineLocaleData[locale].offlineDescription,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function OfflinePage() {
  return <OfflineContent />;
}
