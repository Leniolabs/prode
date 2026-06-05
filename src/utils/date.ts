import { Match } from '@/generated/prisma';

function parseTimezoneOffset(timezone?: string) {
  if (!timezone) return null;
  const parsed = parseInt(timezone, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function applyTimezoneOffset(date: Date, timezone?: string) {
  const newDate = new Date(date);
  const timezoneOffset = parseTimezoneOffset(timezone);
  if (timezoneOffset === null) return newDate;

  newDate.setMinutes(
    newDate.getMinutes() + newDate.getTimezoneOffset() - timezoneOffset
  );

  return newDate;
}

export function getNextTenMinutesDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
}

export function formatDate(date: Date, locale: string, timezone?: string) {
  const dateLocale = !locale || locale === "es" ? "es-AR" : "en-US";
  const newDate = applyTimezoneOffset(date, timezone);

  const dayShort = newDate
    .toLocaleString(dateLocale, {
      weekday: "short",
    })
    .replace(".", "");

  const day = newDate.toLocaleString(dateLocale, {
    day: "numeric",
  });

  const month = newDate.toLocaleString(dateLocale, {
    month: "numeric",
  });

  const hour = newDate.toLocaleString(dateLocale, {
    hour: "numeric",
    minute: "numeric",
  });

  return `${dayShort} ${day}/${month} - ${hour}`;
}

export function formatHour(date: Date, locale: string, timezone?: string) {
  const dateLocale = locale === "es" ? "es-AR" : "en-US";
  const newDate = applyTimezoneOffset(date, timezone);

  const hour = newDate.toLocaleString(dateLocale, {
    hour: "numeric",
    minute: "numeric",
  });

  return `${hour}`;
}

export function getTodayMatches<T extends { id: string; date: string }>(
  matches: T[],
  timezone?: string
) {
  const date = applyTimezoneOffset(new Date(), timezone); //2022, 10, 22);

  if (date.getHours() >= 21) return [];

  const init = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const todayMatches = matches
    .sort((a, b) =>
      applyTimezoneOffset(new Date(a.date), timezone) >=
      applyTimezoneOffset(new Date(b.date), timezone)
        ? 1
        : -1
    )
    .filter(
      (match) => {
        const matchDate = applyTimezoneOffset(new Date(match.date), timezone);
        return matchDate >= init && matchDate <= end;
      }
    );

  if (!todayMatches.length) return [];

  const lastDateToday = new Date(
    todayMatches.sort((a, b) =>
      applyTimezoneOffset(new Date(a.date), timezone) <=
      applyTimezoneOffset(new Date(b.date), timezone)
        ? 1
        : -1
    )[0].date
  );

  const checkDate = applyTimezoneOffset(lastDateToday, timezone);
  checkDate.setHours(checkDate.getHours() + 3);

  if (applyTimezoneOffset(new Date(), timezone) > checkDate) return [];

  return todayMatches.sort((a, b) =>
    applyTimezoneOffset(new Date(a.date), timezone) >=
    applyTimezoneOffset(new Date(b.date), timezone)
      ? 1
      : -1
  );
}

export function getNextMatches<T extends { id: string; date: string }>(
  matches: T[],
  timezone?: string
) {
  const date = applyTimezoneOffset(new Date(), timezone);

  const sortedMatches = matches
    .filter((row) => applyTimezoneOffset(new Date(row.date), timezone) >= date)
    .sort((a, b) =>
      applyTimezoneOffset(new Date(a.date), timezone) >=
      applyTimezoneOffset(new Date(b.date), timezone)
        ? 1
        : -1
    );

  if (!sortedMatches.length) return [];

  const firstDate = applyTimezoneOffset(new Date(sortedMatches[0]?.date), timezone);

  const init = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate()
  );

  const end = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate() + 1
  );

  return sortedMatches.filter(
    (match) => {
      const matchDate = applyTimezoneOffset(new Date(match.date), timezone);
      return matchDate >= init && matchDate <= end;
    }
  );
}
