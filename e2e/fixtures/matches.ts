export const countries = [
  { id: "clcountry1", code: "ARG", name: "Argentina" },
  { id: "clcountry2", code: "BRA", name: "Brazil" },
  { id: "clcountry3", code: "FRA", name: "France" },
  { id: "clcountry4", code: "GER", name: "Germany" },
];

export function makeGroupMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "clmatch1",
    date: "2026-06-15T15:00:00.000Z",
    stage: "GROUP_A",
    filled: false,
    disabled: false,
    goalsLeft: null,
    userGoalsLeft: null,
    countryLeftId: "clcountry1",
    goalsRight: null,
    userGoalsRight: null,
    countryRightId: "clcountry2",
    resultStatus: null,
    ...overrides,
  };
}

export function makeFinalsMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "clfinalmatch1",
    date: "2026-07-01T15:00:00.000Z",
    stage: "FINALS_16_1",
    filled: false,
    disabled: false,
    goalsLeft: null,
    penaltisLeft: null,
    userGoalsLeft: null,
    userPenaltisLeft: null,
    userCountryLeftId: null,
    countryLeftId: "clcountry1",
    goalsRight: null,
    penaltisRight: null,
    userGoalsRight: null,
    userPenaltisRight: null,
    userCountryRightId: null,
    countryRightId: "clcountry2",
    countryStatus: null,
    resultStatus: null,
    ...overrides,
  };
}

// Two GROUP_A matches for a realistic groups page load.
export const groupMatches = [
  makeGroupMatch({ id: "clmatch1", countryLeftId: "clcountry1", countryRightId: "clcountry2" }),
  makeGroupMatch({ id: "clmatch2", countryLeftId: "clcountry3", countryRightId: "clcountry4" }),
];

// Round of 16 match for finals page.
export const finalsMatches = [
  makeFinalsMatch({ id: "clfinalmatch1" }),
  makeFinalsMatch({ id: "clfinalmatch2", stage: "FINALS_16_2", countryLeftId: "clcountry3", countryRightId: "clcountry4" }),
];
