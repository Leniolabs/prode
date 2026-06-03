export {};

type ApiSportsEnvelope<T> = {
  get?: string;
  parameters?: Record<string, string | number | boolean | null> | unknown[];
  errors?: string[] | Record<string, unknown>;
  results?: number;
  paging?: {
    current?: number;
    total?: number;
  };
  response?: T;
};

type League = {
  league?: {
    id?: number;
    name?: string;
    type?: string;
    country?: string;
    logo?: string;
    flag?: string | null;
  };
  country?: {
    name?: string;
    code?: string;
    flag?: string | null;
  };
  seasons?: Array<{
    year?: number;
    current?: boolean;
    coverage?: {
      fixtures?: {
        events?: boolean;
        lineups?: boolean;
        statistics_fixtures?: boolean;
        statistics_players?: boolean;
      };
      standings?: boolean;
      players?: boolean;
      predictions?: boolean;
      odds?: boolean;
    };
  }>;
};

const BASE_URL = process.env.API_SPORTS_BASE_URL ?? "https://v3.football.api-sports.io";
const API_KEY = process.env.API_SPORTS_KEY;

if (!API_KEY) {
  throw new Error(
    "Missing API_SPORTS_KEY. Add it to your environment before running the experiment.",
  );
}

async function apiGet<T>(path: string, searchParams?: Record<string, string | number | boolean>) {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const headers: HeadersInit = {
    accept: "application/json",
  };
  if (API_KEY) {
    headers["x-apisports-key"] = API_KEY;
  }

  const response = await fetch(url, {
    headers,
  });

  const text = await response.text();
  let payload: ApiSportsEnvelope<T> | string = text;

  try {
    payload = JSON.parse(text) as ApiSportsEnvelope<T>;
  } catch {
    // Keep the raw body if the API returns HTML or a non-JSON error payload.
  }

  if (!response.ok) {
    throw new Error(
      `API-Sports request failed: ${response.status} ${response.statusText}\n${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}`,
    );
  }

  return payload as ApiSportsEnvelope<T>;
}

function getSeasonYears(league: League) {
  return (league.seasons ?? [])
    .map((season) => season.year)
    .filter((year): year is number => typeof year === "number")
    .sort((a, b) => b - a);
}

function pickCoverage(season: NonNullable<League["seasons"]>[number] | undefined) {
  return {
    fixtures: season?.coverage?.fixtures ?? null,
    standings: season?.coverage?.standings ?? null,
    players: season?.coverage?.players ?? null,
    predictions: season?.coverage?.predictions ?? null,
    odds: season?.coverage?.odds ?? null,
  };
}

async function main() {
  console.log(`API-Sports football v3 base: ${BASE_URL}`);

  const leagues = await apiGet<League[]>("/leagues", { search: "World Cup" });
  const worldCupLeagues = (leagues.response ?? []).filter((entry) => {
    const name = entry.league?.name ?? "";
    const country = entry.country?.name ?? "";
    return /world cup/i.test(name) || /world cup/i.test(country);
  });

  console.log("\n== /leagues?search=World Cup ==");
  console.log(
    JSON.stringify(
      {
        get: leagues.get,
        results: leagues.results,
        paging: leagues.paging,
        errors: leagues.errors,
      },
      null,
      2,
    ),
  );

  console.log("\nWorld Cup matches:");
  console.table(
    worldCupLeagues.map((entry) => ({
      id: entry.league?.id ?? null,
      name: entry.league?.name ?? null,
      type: entry.league?.type ?? null,
      country: entry.country?.name ?? entry.league?.country ?? null,
      seasons: getSeasonYears(entry).join(", "),
    })),
  );

  const sampleLeague = worldCupLeagues[0];
  const sampleSeason = getSeasonYears(sampleLeague ?? {})[0] ?? 2026;

  if (sampleLeague?.league?.id) {
    console.log("\nCoverage snapshot for the first World Cup match:");
    console.log(
      JSON.stringify(
        {
          id: sampleLeague.league.id,
          name: sampleLeague.league.name,
          country: sampleLeague.country?.name ?? sampleLeague.league.country,
          seasons: sampleLeague.seasons?.map((season) => ({
            year: season?.year,
            current: season?.current ?? null,
            coverage: pickCoverage(season),
          })),
        },
        null,
        2,
      ),
    );

    const rounds = await apiGet<string[]>("/fixtures/rounds", {
      league: sampleLeague.league.id,
      season: sampleSeason,
    });

    console.log("\n== /fixtures/rounds ==");
    console.log(
      JSON.stringify(
        {
          get: rounds.get,
          results: rounds.results,
          paging: rounds.paging,
          response: rounds.response,
        },
        null,
        2,
      ),
    );
  } else {
    console.log("\nNo World Cup competition matched the search term.");
  }

  const seasons = await apiGet<number[]>("/leagues/seasons");
  console.log("\n== /leagues/seasons ==");
  console.log(
    JSON.stringify(
      {
        get: seasons.get,
        results: seasons.results,
        response: seasons.response,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
