export type ApiSportsMatch = {
  id: number;
  kickoffUtc: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePen: number | null;
  awayPen: number | null;
  status: string | null;
  phase: string | null;
};

type RawApiSportsMatch = {
  id?: unknown;
  kickoff_utc?: unknown;
  home_team_code?: unknown;
  away_team_code?: unknown;
  home_score?: unknown;
  away_score?: unknown;
  home_pen?: unknown;
  away_pen?: unknown;
  status?: unknown;
  phase?: unknown;
};

function getConfig() {
  const apiKey = process.env.API_SPORTS_KEY;
  if (!apiKey) {
    throw new Error("Missing API_SPORTS_KEY");
  }

  const baseUrl = process.env.API_SPORTS_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing API_SPORTS_BASE_URL");
  }

  return {
    apiKey,
    baseUrl,
  };
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function normalizeMatch(raw: RawApiSportsMatch): ApiSportsMatch | null {
  const id = parseNullableNumber(raw.id);
  const kickoffUtc = parseNullableString(raw.kickoff_utc);

  if (id === null || kickoffUtc === null) {
    return null;
  }

  return {
    id,
    kickoffUtc,
    homeTeamCode: parseNullableString(raw.home_team_code)?.toUpperCase() ?? null,
    awayTeamCode: parseNullableString(raw.away_team_code)?.toUpperCase() ?? null,
    homeScore: parseNullableNumber(raw.home_score),
    awayScore: parseNullableNumber(raw.away_score),
    homePen: parseNullableNumber(raw.home_pen),
    awayPen: parseNullableNumber(raw.away_pen),
    status: parseNullableString(raw.status),
    phase: parseNullableString(raw.phase),
  };
}

export async function fetchMatches(): Promise<ApiSportsMatch[]> {
  const { apiKey, baseUrl } = getConfig();
  const url = new URL("/matches", baseUrl);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      apikey: apiKey,
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = text;

  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `API Sports ${url} -> ${response.status} ${response.statusText}\n${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}`,
    );
  }

  if (!Array.isArray(payload)) {
    throw new Error("API Sports /matches did not return an array payload");
  }

  return payload
    .map((entry) => normalizeMatch(entry as RawApiSportsMatch))
    .filter((entry): entry is ApiSportsMatch => entry !== null);
}
