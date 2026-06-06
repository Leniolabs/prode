export type HarnessAuthMode = "public" | "user" | "admin";

export interface HarnessViewport {
  width: number;
  height: number;
}

export interface HarnessFixtures {
  roomId: string;
  viewUserProdeId: string;
}

export interface HarnessRouteSpec {
  name: string;
  fileName: string;
  auth: HarnessAuthMode;
  buildPath: (fixtures: HarnessFixtures) => string;
  viewport?: HarnessViewport;
}

export const harnessRoutes: HarnessRouteSpec[] = [
  {
    name: "landing",
    fileName: "index.png",
    auth: "public",
    buildPath: () => "/",
  },
  {
    name: "login",
    fileName: "login.png",
    auth: "public",
    buildPath: () => "/login",
  },
  {
    name: "rooms",
    fileName: "rooms.png",
    auth: "user",
    buildPath: () => "/rooms",
  },
  {
    name: "rooms-mobile",
    fileName: "rooms.mobile.png",
    auth: "user",
    buildPath: () => "/rooms",
    viewport: { width: 375, height: 812 },
  },
  {
    name: "new-prode",
    fileName: "new-prode.png",
    auth: "user",
    buildPath: () => "/new-prode",
  },
  {
    name: "new-prode-mobile",
    fileName: "new-prode.mobile.png",
    auth: "user",
    buildPath: () => "/new-prode",
    viewport: { width: 375, height: 812 },
  },
  {
    name: "groups",
    fileName: "groups.png",
    auth: "user",
    buildPath: () => "/groups",
  },
  {
    name: "view",
    fileName: "id_view.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.viewUserProdeId}/view`,
  },
  {
    name: "room-groups",
    fileName: "id_groups.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/groups`,
  },
  {
    name: "room-groups-mobile",
    fileName: "id_groups.mobile.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/groups`,
    viewport: { width: 375, height: 812 },
  },
  {
    name: "ranking",
    fileName: "id_ranking.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/ranking`,
  },
  {
    name: "ranking-mobile",
    fileName: "id_ranking.mobile.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/ranking`,
    viewport: { width: 375, height: 812 },
  },
  {
    name: "finals",
    fileName: "finals.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/finals`,
  },
  {
    name: "results",
    fileName: "id_results.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/results`,
  },
  {
    name: "admin",
    fileName: "admin.png",
    auth: "admin",
    buildPath: () => "/admin",
  },
  {
    name: "blocked",
    fileName: "blocked.png",
    auth: "public",
    buildPath: () => "/blocked",
  },
  {
    name: "maintenance",
    fileName: "maintenance.png",
    auth: "public",
    buildPath: () => "/maintenance",
  },
];

export function getBaselinePath(fileName: string) {
  return `harness/baseline/${fileName}`;
}

export function getScreenshotPath(fileName: string) {
  return `harness/screenshots/${fileName}`;
}
