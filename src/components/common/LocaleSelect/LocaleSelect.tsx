import Link from "next/link";
import { useRouter } from "next/router";
import { className } from "../../../utils/classname";
import styles from "./LocaleSelect.module.scss";

interface LocaleSelectProps {}

export function LocaleSelect(props: LocaleSelectProps) {
  const { locale: currentLocale, locales, asPath } = useRouter();

  return (
    <div className={styles.localeSelect}>
      {locales?.map((locale, i, arr) => (
        <div key={locale}>
          <Link href={asPath} locale={locale} legacyBehavior>
            <a
              className={className(
                locale === currentLocale ? styles.active : ""
              )}
            >
              {locale.toLocaleUpperCase()}
            </a>
          </Link>
          <span>{arr.length > i + 1 ? "|" : ""}</span>
        </div>
      ))}
    </div>
  );
}
