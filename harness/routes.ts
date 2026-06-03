export type HarnessAuthMode = "public" | "user" | "admin";

export interface HarnessFixtures {
  roomId: string;
  viewUserProdeId: string;
}

export interface HarnessRouteSpec {
  name: string;
  fileName: string;
  auth: HarnessAuthMode;
  buildPath: (fixtures: HarnessFixtures) => string;
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
    name: "view",
    fileName: "id_view.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.viewUserProdeId}/view`,
  },
  {
    name: "ranking",
    fileName: "id_ranking.png",
    auth: "user",
    buildPath: (fixtures) => `/${fixtures.roomId}/ranking`,
  },
  {
    name: "admin",
    fileName: "admin.png",
    auth: "admin",
    buildPath: () => "/admin",
  },
];

export function getBaselinePath(fileName: string) {
  return `harness/baseline/${fileName}`;
}

export function getScreenshotPath(fileName: string) {
  return `harness/screenshots/${fileName}`;
}
