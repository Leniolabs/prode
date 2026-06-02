import styles from "./LocaleSelect.module.scss";

interface LocaleSelectProps {}

// Locale selection was powered by Next.js Pages Router i18n routing.
// After migrating to App Router (Migration G), i18n routing is removed.
// This component is a no-op stub until a replacement i18n solution lands.
export function LocaleSelect(props: LocaleSelectProps) {
  return <div className={styles.localeSelect} />;
}
