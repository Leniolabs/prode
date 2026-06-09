import { type Page, type Route } from "@playwright/test";
import { sessionUser } from "../fixtures/auth";
import { countries } from "../fixtures/matches";
import {
  roomsPageData,
  newProdePageData,
  roomGroupsData,
  roomFinalsData,
  roomRankingData,
  roomResultsData,
  viewPageData,
  adminPageData,
  adminFinalsData,
  ROOM_ID,
} from "../fixtures/pageData";

type ResponseBody = object | null;
type RouteHandler = (route: Route) => void | Promise<void>;

export interface MockOverrides {
  // null  → session status "unauthenticated" (useRequireSession triggers signIn)
  // object → session status "authenticated"
  // omit  → defaults to sessionUser
  session?: ResponseBody;
  roomsPage?: ResponseBody;
  newProdePage?: ResponseBody;
  checkRoomName?: ResponseBody;
  createRoom?: ResponseBody;
  roomGroups?: ResponseBody;
  roomFinals?: ResponseBody;
  roomRanking?: ResponseBody;
  roomResults?: ResponseBody;
  viewPage?: ResponseBody;
  checkPassword?: ResponseBody;
  adminPage?: ResponseBody;
  adminFinals?: ResponseBody;
  groupsSave?: ResponseBody | RouteHandler;
  finalsSave?: ResponseBody | RouteHandler;
  profile?: ResponseBody;
  roomUpdate?: ResponseBody;
  roomLeave?: ResponseBody | RouteHandler;
  finalsStart?: ResponseBody;
  adminReset?: ResponseBody;
  adminPrune?: ResponseBody;
  adminDeleteRoom?: ResponseBody | RouteHandler;
  adminBlockUser?: ResponseBody | RouteHandler;
}

function json(route: Route, body: ResponseBody, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function asHandler(override: ResponseBody | RouteHandler, fallback: ResponseBody): RouteHandler {
  if (typeof override === "function") return override as RouteHandler;
  return (route) => json(route, override ?? fallback);
}

export async function installApiMocks(page: Page, overrides: MockOverrides = {}) {
  // Inject session via addInitScript so it's available synchronously before any
  // page JS runs. SessionWrapper reads window.__E2E_SESSION at module-eval time
  // and passes it to SessionProvider as the `session` prop. When session is
  // non-undefined, SessionProvider sets hasInitialSession=true and never fetches
  // /api/auth/session — eliminating the timing race entirely.
  //
  // null  → useSession returns { status: "unauthenticated" }
  // object → useSession returns { status: "authenticated", data: object }
  const sessionValue: unknown = overrides.session !== undefined ? overrides.session : sessionUser;
  await page.addInitScript((s: unknown) => {
    (window as { __E2E_SESSION?: unknown }).__E2E_SESSION = s;
  }, sessionValue);

  // CSRF token — next-auth fetches this before signIn("google") calls
  await page.route("**/api/auth/csrf", (route) =>
    json(route, { csrfToken: "test-csrf-token" })
  );

  // Providers — intercepted so signIn doesn't 500 in unauthenticated tests
  await page.route("**/api/auth/providers", (route) =>
    json(route, {
      google: {
        id: "google",
        name: "Google",
        type: "oauth",
        signinUrl: "http://127.0.0.1:3000/api/auth/signin/google",
        callbackUrl: "http://127.0.0.1:3000/api/auth/callback/google",
      },
    })
  );

  // Countries
  await page.route("**/api/countries", (route) => json(route, countries));

  // Page-data endpoints
  await page.route(
    "**/api/rooms-page-data",
    (route) => json(route, overrides.roomsPage !== undefined ? overrides.roomsPage : roomsPageData())
  );
  await page.route(
    "**/api/new-prode-page-data",
    (route) => json(route, overrides.newProdePage !== undefined ? overrides.newProdePage : newProdePageData())
  );
  await page.route(
    "**/api/check-room-name*",
    (route) => json(route, overrides.checkRoomName !== undefined ? overrides.checkRoomName : { allowed: true })
  );
  await page.route(
    "**/api/groups-page-data*",
    (route) => json(route, roomGroupsData())
  );
  await page.route(
    "**/api/finals-page-data*",
    (route) => json(route, { redirect: "/groups" })
  );

  // Room-scoped page-data
  await page.route(
    "**/api/room-groups-data*",
    (route) => json(route, overrides.roomGroups !== undefined ? overrides.roomGroups : roomGroupsData())
  );
  await page.route(
    "**/api/room-finals-data*",
    (route) => json(route, overrides.roomFinals !== undefined ? overrides.roomFinals : roomFinalsData())
  );
  await page.route(
    "**/api/room-ranking-data*",
    (route) => json(route, overrides.roomRanking !== undefined ? overrides.roomRanking : roomRankingData())
  );
  await page.route(
    "**/api/room-results-data*",
    (route) => json(route, overrides.roomResults !== undefined ? overrides.roomResults : roomResultsData())
  );
  await page.route(
    "**/api/view-page-data*",
    (route) => json(route, overrides.viewPage !== undefined ? overrides.viewPage : viewPageData())
  );

  // Admin page-data
  await page.route(
    "**/api/admin-page-data*",
    (route) => json(route, overrides.adminPage !== undefined ? overrides.adminPage : adminPageData())
  );
  await page.route(
    "**/api/admin-finals-data",
    (route) => json(route, overrides.adminFinals !== undefined ? overrides.adminFinals : adminFinalsData())
  );

  // Mutation: create room
  await page.route(
    "**/api/create",
    (route) => json(route, overrides.createRoom !== undefined ? overrides.createRoom : { id: ROOM_ID })
  );

  // Mutation: profile
  await page.route(
    "**/api/profile",
    (route) => json(route, overrides.profile !== undefined ? overrides.profile : {})
  );

  // Mutation: check password
  await page.route(
    /\/api\/[^/]+\/checkpassword$/,
    (route) => json(route, overrides.checkPassword !== undefined ? overrides.checkPassword : { allowed: true })
  );

  // Mutation: room settings update
  await page.route(
    /\/api\/[^/]+\/update$/,
    (route) => json(route, overrides.roomUpdate !== undefined ? overrides.roomUpdate : { id: ROOM_ID })
  );

  // Mutation: save group predictions (room-scoped, not admin/groups)
  await page.route(
    /\/api\/[^/]+\/groups$/,
    (route) => {
      if (route.request().url().includes("/api/admin/")) {
        return route.fallback();
      }
      if (overrides.groupsSave) {
        return asHandler(overrides.groupsSave, { matches: [] })(route);
      }
      return json(route, { matches: [] });
    }
  );

  // Mutation: save finals predictions (room-scoped, not admin/finals)
  await page.route(
    /\/api\/[^/]+\/finals$/,
    (route) => {
      if (route.request().url().includes("/api/admin/")) {
        return route.fallback();
      }
      if (overrides.finalsSave) {
        return asHandler(overrides.finalsSave, {})(route);
      }
      return route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    }
  );

  // Mutation: leave room
  await page.route(/\/api\/[^/]+\/leave$/, (route) => {
    if (overrides.roomLeave) {
      return asHandler(overrides.roomLeave, {})(route);
    }
    return json(route, {});
  });

  // Admin mutations
  await page.route(
    "**/api/admin/finals-start",
    (route) => json(route, overrides.finalsStart !== undefined ? overrides.finalsStart : {})
  );
  await page.route(
    "**/api/admin/reset",
    (route) => json(route, overrides.adminReset !== undefined ? overrides.adminReset : {})
  );
  await page.route(
    "**/api/admin/prune",
    (route) => json(route, overrides.adminPrune !== undefined ? overrides.adminPrune : {})
  );
  await page.route(/\/api\/admin\/rooms\/[^/]+\/delete$/, (route) => {
    if (overrides.adminDeleteRoom) {
      return asHandler(overrides.adminDeleteRoom, {})(route);
    }
    return json(route, {});
  });
  await page.route(/\/api\/admin\/users\/[^/]+\/block$/, (route) => {
    if (overrides.adminBlockUser) {
      return asHandler(overrides.adminBlockUser, {})(route);
    }
    return json(route, {});
  });

  // Admin official results
  await page.route("**/api/admin/groups", (route) => json(route, { matches: [] }));
  await page.route("**/api/admin/finals", (route) => json(route, { matches: [] }));

  // Catch-all: fall through so previously registered specific routes can still
  // handle the request. If nothing handles it, the app hits the real Next
  // route, which keeps missing mocks visible in test behavior.
  await page.route("**/api/**", (route) => {
    return route.fallback();
  });
}
