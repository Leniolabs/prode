import { groupMatches, finalsMatches } from "./matches";
import { userRanking, makeRankingRow } from "./ranking";

export const ROOM_ID = "clroom1";
export const ROOM_ID_PW = "clroom2";
export const USER_PRODE_ID = "cluserprode1";
export const USER_ID = "cluser1";
export const SUBMISSION_ENDS_FUTURE = "2026-12-31T23:59:59.000Z";
export const SUBMISSION_ENDS_PAST = "2020-01-01T00:00:00.000Z";

const baseRoom = {
  id: ROOM_ID,
  name: "Mi Prode",
  password: null,
  public: true,
  emailDomain: null,
  pointsWinner: 1,
  pointsGoals: 3,
  pointsPenal: 5,
};

export function roomsPageData(overrides: Record<string, unknown> = {}) {
  return {
    finalsStarted: false,
    prodeEnd: SUBMISSION_ENDS_FUTURE,
    rooms: [
      { id: ROOM_ID, name: "Mi Prode", hasPassword: false, playerCount: 5, open: true, alreadyJoin: true },
      { id: ROOM_ID_PW, name: "Sala Privada", hasPassword: true, playerCount: 3, open: false, alreadyJoin: false },
    ],
    userRanking,
    registeredProdes: 1,
    ...overrides,
  };
}

export function newProdePageData(overrides: Record<string, unknown> = {}) {
  return {
    userRanking,
    registeredProdes: 1,
    ...overrides,
  };
}

export function roomGroupsData(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    userProdeId: USER_PRODE_ID,
    roomAdmin: false,
    name: "Mi Prode",
    room: baseRoom,
    finalsStarted: false,
    submissionEndsAt: SUBMISSION_ENDS_FUTURE,
    userRanking: { ...userRanking, points: 45, ranking: 1 },
    ranking: [makeRankingRow()],
    matches: groupMatches,
    todayMatches: null,
    nextMatches: null,
    ...overrides,
  };
}

export function roomFinalsData(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    userProdeId: USER_PRODE_ID,
    roomAdmin: false,
    name: "Mi Prode",
    room: baseRoom,
    finalsStarted: true,
    submissionEndsAt: SUBMISSION_ENDS_FUTURE,
    userRanking: { ...userRanking, points: 45, ranking: 1 },
    ranking: [makeRankingRow()],
    matches: finalsMatches,
    todayMatches: null,
    nextMatches: null,
    ...overrides,
  };
}

export function roomRankingData(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    userProdeId: USER_PRODE_ID,
    roomAdmin: false,
    name: "Mi Prode",
    finalsStarted: false,
    room: baseRoom,
    userRanking: { ...userRanking, GROUP_A: 9, GROUP_B: 6, GROUP_C: 3, GROUP_D: 0, GROUP_E: 0, GROUP_F: 0, GROUP_G: 0, GROUP_H: 0, GROUP_I: 0, GROUP_J: 0, GROUP_K: 0, GROUP_L: 0, FINALS_8: 0, FINALS_4: 0, FINALS_2: 0, FINAL: 0, FINALS_16: 0, isAdmin: false },
    page: 0,
    totalPages: 1,
    totalPlayers: 2,
    ranking: [makeRankingRow(), makeRankingRow({ id: "cluserprode2", userId: "cluser2", name: "Bob", email: "bob@example.com", ranking: 2, points: 20 })],
    ...overrides,
  };
}

export function roomResultsData(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    roomAdmin: false,
    name: "Mi Prode",
    finalsStarted: true,
    room: baseRoom,
    userRanking,
    ranking: [makeRankingRow()],
    ...overrides,
  };
}

export function viewPageData(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_ID,
    userProdeId: USER_PRODE_ID,
    name: "Mi Prode",
    roomAdmin: false,
    userInRoom: true,
    viewUser: { id: "cluser2", name: "Bob", image: "https://example.com/bob.jpg" },
    room: null,
    finalsStarted: false,
    userRanking,
    matches: groupMatches,
    finalsMatches: [],
    ...overrides,
  };
}

export function adminPageData(overrides: Record<string, unknown> = {}) {
  return {
    userCount: 50,
    roomCount: 10,
    prodeCount: 120,
    rooms: [
      { id: ROOM_ID, name: "Mi Prode", public: true, password: null, emailDomain: null, playerCount: 5 },
    ],
    users: [
      { id: USER_ID, name: "Alice", email: "alice@example.com", blocked: false },
      { id: "cluser2", name: "Bob", email: "bob@example.com", blocked: false },
    ],
    ...overrides,
  };
}

export function adminFinalsData(overrides: Record<string, unknown> = {}) {
  return {
    matches: finalsMatches.map(m => ({
      id: m.id,
      date: m.date,
      stage: m.stage,
      filled: m.filled,
      goalsLeft: m.goalsLeft,
      countryLeftId: m.countryLeftId,
      penaltisLeft: m.penaltisLeft,
      goalsRight: m.goalsRight,
      countryRightId: m.countryRightId,
      penaltisRight: m.penaltisRight,
    })),
    ...overrides,
  };
}
