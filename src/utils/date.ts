import { Match } from '@/generated/prisma';
import { FinalsStageGroup, getFinalsStageGroup } from '@/utils/finals';

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
 * The lock time of the knockout tier a finals match belongs to: the first
 * kickoff of its tier (see FINALS_TIER_DEADLINES in config/matchdays.ts).
 * Unlike groups, finals matches lock by stage tier rather than by date, because
 * within a tier the matches are spread across several days but must all close
 * together at the tier's opener. Returns null for non-finals stages.
 */
export function finalsTierLockTime(
  stage: string,
  deadlines: Record<FinalsStageGroup, Date>,
): Date | null {
  const group = getFinalsStageGroup(stage);
  return group ? deadlines[group] ?? null : null;
}

/**
 * True once the tier containing `stage` has kicked off, i.e. its first match
 * has started. All matches of a tier lock together at that moment; later tiers
 * stay open until their own first kickoff.
 */
export function isFinalsMatchLocked(
  stage: string,
  deadlines: Record<FinalsStageGroup, Date>,
  now: Date = new Date(),
) {
  const lock = finalsTierLockTime(stage, deadlines);
  return lock !== null && lock.getTime() <= now.getTime();
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
