const BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// ESPN status names that mean the match is over and the score is final.
const FINAL_STATUS = new Set([
  "STATUS_FULL_TIME",
  "STATUS_FINAL",
  "STATUS_FINAL_PEN",
]);

export type EspnCompetitor = {
  homeAway: "home" | "away";
  score?: string;
  shootoutScore?: string;
  team: {
    id: string;
    abbreviation?: string;
    displayName?: string;
  };
};

export type EspnEvent = {
  id: string;
  date: string;
  status: {
    type: {
      name: string;
      completed: boolean;
      state?: string;
      description?: string;
      detail?: string;
    };
  };
  competitions: { competitors: EspnCompetitor[] }[];
};

export type EspnTeam = {
  id: string;
  abbreviation?: string;
  displayName?: string;
};

type ScoreboardResponse = { events?: EspnEvent[] };

type TeamsResponse = {
  sports?: { leagues?: { teams?: { team: EspnTeam }[] }[] }[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Results change as matches finish — never cache.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function isFinal(event: EspnEvent): boolean {
  return (
    event.status.type.completed || FINAL_STATUS.has(event.status.type.name)
  );
}

/** Fetch the scoreboard for a single day. `date` is YYYY-MM-DD. */
export async function fetchScoreboard(date: string): Promise<EspnEvent[]> {
  const yyyymmdd = date.replace(/-/g, "");
  const url = `${BASE_URL}/scoreboard?dates=${yyyymmdd}`;
  const data = await getJson<ScoreboardResponse>(url);
  return data.events ?? [];
}

/** Fetch the scoreboard for a date range. `dates` is YYYYMMDD-YYYYMMDD. */
export async function fetchScoreboardRange(dates: string): Promise<EspnEvent[]> {
  const url = `${BASE_URL}/scoreboard?dates=${dates}`;
  const data = await getJson<ScoreboardResponse>(url);
  return data.events ?? [];
}

/** Fetch the full World Cup team list for a season (default 2026). */
export async function fetchTeams(season = 2026): Promise<EspnTeam[]> {
  const url = `${BASE_URL}/teams?dates=${season}`;
  const data = await getJson<TeamsResponse>(url);
  const out: EspnTeam[] = [];
  for (const sport of data.sports ?? []) {
    for (const league of sport.leagues ?? []) {
      for (const entry of league.teams ?? []) {
        out.push(entry.team);
      }
    }
  }
  return out;
}
