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

function normalizeMeridiem(value: string) {
  return value
    .replace(/\ba\.\s*m\./gi, "a.m.")
    .replace(/\bp\.\s*m\./gi, "p.m.");
}

/**
 * The lock time of a group match: its own kickoff. Group matches no longer lock
 * as a block per fecha; each one closes individually at the moment it starts.
 * `deadlines` (ascending, see config/matchdays.ts) is kept only as a sanity
 * guard: a match dated before the first deadline returns null (malformed data).
 */
export function groupMatchLockTime(matchDate: Date, deadlines: Date[]) {
  if (deadlines.length && matchDate.getTime() < deadlines[0].getTime()) {
    return null;
  }
  return new Date(matchDate);
}

/**
 * True once `matchDate` has been reached, i.e. the match has kicked off. Each
 * group match locks independently at its own kickoff; later same-fecha matches
 * stay editable until they start.
 */
export function isGroupMatchLocked(
  matchDate: Date,
  deadlines: Date[],
  now: Date = new Date(),
) {
  const lock = groupMatchLockTime(matchDate, deadlines);
  return lock !== null && lock.getTime() <= now.getTime();
}

/**
 * The lock time of a finals match: its own kickoff. Knockout matches now lock
 * individually at the moment they start, the same as group matches, rather than
 * as a tier block at the round's first kickoff.
 */
export function finalsMatchLockTime(matchDate: Date) {
  return new Date(matchDate);
}

/**
 * True once `matchDate` has been reached, i.e. the finals match has kicked off.
 * Each knockout match locks independently at its own kickoff; later same-tier
 * matches stay editable until they start.
 */
export function isFinalsMatchLocked(matchDate: Date, now: Date = new Date()) {
  return matchDate.getTime() <= now.getTime();
}

export function formatDate(date: Date, locale: string, timezone?: string) {
  const dateLocale = !locale || locale === "es" ? "es-AR" : "en-US";
  const newDate = applyTimezoneOffset(date, timezone);

  const dayShort = newDate
    .toLocaleString(dateLocale, {
      weekday: "short",
    })
    .replace(".", "");

  const dayShortCap = dayShort.charAt(0).toUpperCase() + dayShort.slice(1);

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

  return `${dayShortCap} ${day}/${month} - ${normalizeMeridiem(hour)}`;
}

export function formatHour(date: Date, locale: string, timezone?: string) {
  const dateLocale = locale === "es" ? "es-AR" : "en-US";
  const newDate = applyTimezoneOffset(date, timezone);

  const hour = newDate.toLocaleString(dateLocale, {
    hour: "numeric",
    minute: "numeric",
  });

  return normalizeMeridiem(hour);
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
