import { Match } from '@/generated/prisma';

export function getNextTenMinutesDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
}

export function formatDate(date: Date, locale: string, timezone?: string) {
  const dateLocale = !locale || locale === "es" ? "es-AR" : "en-US";

  const newDate = new Date(date);
  const timezoneOffset = newDate.getTimezoneOffset();
  if (timezone)
    newDate.setMinutes(
      newDate.getMinutes() + timezoneOffset - parseInt(timezone, 10)
    );

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

  const newDate = new Date(date);
  const timezoneOffset = newDate.getTimezoneOffset();
  if (timezone)
    newDate.setMinutes(
      newDate.getMinutes() + timezoneOffset - parseInt(timezone, 10)
    );

  const hour = newDate.toLocaleString(dateLocale, {
    hour: "numeric",
    minute: "numeric",
  });

  return `${hour}`;
}

export function getTodayMatches<T extends { id: string; date: string }>(
  matches: T[]
) {
  const date = new Date(); //2022, 10, 22);

  if (date.getHours() >= 21) return [];

  const init = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const todayMatches = matches
    .sort((a, b) => (new Date(a.date) >= new Date(b.date) ? 1 : -1))
    .filter(
      (match) => new Date(match.date) >= init && new Date(match.date) <= end
    );

  if (!todayMatches.length) return [];

  const lastDateToday = new Date(
    todayMatches.sort((a, b) =>
      new Date(a.date) <= new Date(b.date) ? 1 : -1
    )[0].date
  );

  const checkDate = new Date(lastDateToday);
  checkDate.setHours(checkDate.getHours() + 3);

  if (new Date() > checkDate) return [];

  return todayMatches.sort((a, b) =>
    new Date(a.date) >= new Date(b.date) ? 1 : -1
  );
}

export function getNextMatches<T extends { id: string; date: string }>(
  matches: T[]
) {
  const date = new Date();

  const sortedMatches = matches
    .filter((row) => new Date(row.date) >= date)
    .sort((a, b) => (new Date(a.date) >= new Date(b.date) ? 1 : -1));

  if (!sortedMatches.length) return [];

  const firstDate = new Date(sortedMatches[0]?.date);

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
    (match) => new Date(match.date) >= init && new Date(match.date) <= end
  );
}
