interface LocaleSelectProps {}

// Locale selection was powered by Next.js Pages Router i18n routing.
// After migrating to App Router (Migration G), i18n routing is removed.
// This component is a no-op stub until a replacement i18n solution lands.
export function LocaleSelect(_props: LocaleSelectProps) {
  return (
    <div className="flex text-white select-none [&_a]:text-white [&_a]:p-1 [&_span]:text-white [&_span]:p-1 [&_a.active]:bg-[#00000033] [&_a:hover]:bg-[#00000033]" />
  );
}
