export const sessionUser = {
  user: {
    id: "cluser1",
    name: "Alice",
    email: "alice@example.com",
    image: "https://example.com/alice.jpg",
  },
  expires: "2026-12-31T00:00:00.000Z",
};

export const sessionAdmin = {
  user: {
    id: "cladmin1",
    name: "Admin",
    email: "admin@example.com",
    image: "https://example.com/admin.jpg",
  },
  expires: "2026-12-31T00:00:00.000Z",
};

// null (not {}) because SessionProvider maps: null → "unauthenticated", {} → "authenticated"
export const sessionNull = null;
