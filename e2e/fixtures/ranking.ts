export function makeRankingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cluserprode1",
    userId: "cluser1",
    name: "Alice",
    image: "https://example.com/alice.jpg",
    email: "alice@example.com",
    prodePublic: true,
    points: 45,
    ranking: 1,
    GROUP_A: 9, GROUP_B: 6, GROUP_C: 3, GROUP_D: 0,
    GROUP_E: 0, GROUP_F: 0, GROUP_G: 0, GROUP_H: 0,
    GROUP_I: 0, GROUP_J: 0, GROUP_K: 0, GROUP_L: 0,
    FINALS_16: 0, FINALS_8: 0, FINALS_4: 0, FINALS_2: 0,
    FINAL: 0,
    isAdmin: false,
    dark: false,
    background: "background-1",
    ...overrides,
  };
}

export const userRanking = {
  id: "cluser1",
  name: "Alice",
  image: "https://example.com/alice.jpg",
  email: "alice@example.com",
  prodePublic: true,
  points: 45,
  ranking: 1,
  dark: false,
  background: "background-1",
};

export const adminRankingRow = makeRankingRow({
  id: "cladmin-prode1",
  userId: "cladmin1",
  name: "Admin",
  email: "admin@example.com",
  isAdmin: true,
  ranking: 2,
  points: 30,
});
