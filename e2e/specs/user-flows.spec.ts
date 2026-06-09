import { test, expect } from "../support/test";
import {
  SUBMISSION_ENDS_FUTURE,
  roomsPageData,
  roomGroupsData,
  roomRankingData,
} from "../fixtures/pageData";
import { groupMatches } from "../fixtures/matches";
import { makeRankingRow } from "../fixtures/ranking";

const FLOW_ROOM_ID = "clflowroom1";
const FLOW_USER_PRODE_ID = "clflow-user-prode1";

function flowRankingData(overrides: Record<string, unknown> = {}) {
  return roomRankingData({
    id: FLOW_ROOM_ID,
    userProdeId: FLOW_USER_PRODE_ID,
    name: "Prode Flow",
    room: {
      id: FLOW_ROOM_ID,
      name: "Prode Flow",
      password: null,
      public: true,
      emailDomain: null,
      pointsWinner: 7,
      pointsGoals: 4,
      pointsPenal: 2,
    },
    ranking: [
      makeRankingRow({
        id: FLOW_USER_PRODE_ID,
        name: "Alice",
        userId: "cluser1",
        ranking: 1,
        points: 0,
      }),
    ],
    totalPlayers: 1,
    ...overrides,
  });
}

function flowGroupsData(overrides: Record<string, unknown> = {}) {
  return roomGroupsData({
    id: FLOW_ROOM_ID,
    userProdeId: FLOW_USER_PRODE_ID,
    name: "Prode Flow",
    room: {
      id: FLOW_ROOM_ID,
      name: "Prode Flow",
      password: null,
      public: true,
      emailDomain: null,
      pointsWinner: 7,
      pointsGoals: 4,
      pointsPenal: 2,
    },
    submissionEndsAt: SUBMISSION_ENDS_FUTURE,
    matches: groupMatches.map((match) => ({ ...match })),
    ...overrides,
  });
}

test.describe("Full user flows", () => {
  test("user can create a room, enter it from the lobby, and submit a group-stage score", async ({
    page,
    mockApi,
  }) => {
    let createPayload: Record<string, unknown> | null = null;
    let groupsPayload:
      | { matches: Array<{ matchId: string; goalsLeft: number; goalsRight: number }> }
      | null = null;

    await mockApi({
      checkRoomName: { allowed: true },
      createRoom: { id: FLOW_ROOM_ID },
      roomRanking: flowRankingData(),
    });

    await page.route("**/api/create", async (route) => {
      createPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: FLOW_ROOM_ID }),
      });
    });

    await page.goto("/new-prode");
    await page.locator('input[placeholder="Nuevo Prode 1"]').fill("Prode Flow");
    await page.getByLabel("Contraseña").fill("mi-clave");
    await page.getByLabel("Puntos por ganador de partido").fill("7");
    await page.getByLabel("Puntos por goles").fill("4");
    await page.getByLabel("Puntos por penales").fill("2");
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(new RegExp(`/${FLOW_ROOM_ID}/ranking`));
    expect(createPayload).toMatchObject({
      name: "Prode Flow",
      password: "mi-clave",
      pointsWinner: 7,
      pointsGoals: 4,
      pointsPenal: 2,
    });

    await mockApi({
      roomsPage: roomsPageData({
        rooms: [
          {
            id: FLOW_ROOM_ID,
            name: "Prode Flow",
            hasPassword: false,
            playerCount: 1,
            open: true,
            alreadyJoin: true,
          },
        ],
      }),
      roomGroups: flowGroupsData(),
      groupsSave: async (route) => {
        groupsPayload = route.request().postDataJSON() as {
          matches: Array<{ matchId: string; goalsLeft: number; goalsRight: number }>;
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ matches: [] }),
        });
      },
    });

    await page.goto("/rooms");
    await page.getByTestId(`room-enter-${FLOW_ROOM_ID}`).click();
    await expect(page).toHaveURL(new RegExp(`/${FLOW_ROOM_ID}/groups`));

    await page.getByTestId("group-match-goals-left").first().fill("2");
    await page.getByTestId("group-match-goals-right").first().fill("1");
    await page.getByRole("button", { name: "Guardar" }).first().click();

    await expect(async () => {
      expect(groupsPayload).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(groupsPayload).toEqual({
      matches: [
        {
          matchId: groupMatches[0].id,
          goalsLeft: 2,
          goalsRight: 1,
        },
      ],
    });
  });

  test("already-started matches stay locked and only editable matches are submitted", async ({
    page,
    mockApi,
  }) => {
    let groupsPayload:
      | { matches: Array<{ matchId: string; goalsLeft: number; goalsRight: number }> }
      | null = null;

    const lockedMatch = {
      ...groupMatches[0],
      disabled: true,
      filled: true,
      goalsLeft: 3,
      goalsRight: 0,
      userGoalsLeft: 3,
      userGoalsRight: 0,
    };

    const editableMatch = {
      ...groupMatches[1],
      disabled: false,
      filled: false,
      userGoalsLeft: null,
      userGoalsRight: null,
    };

    await mockApi({
      roomGroups: flowGroupsData({
        matches: [lockedMatch, editableMatch],
      }),
      groupsSave: async (route) => {
        groupsPayload = route.request().postDataJSON() as {
          matches: Array<{ matchId: string; goalsLeft: number; goalsRight: number }>;
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ matches: [] }),
        });
      },
    });

    await page.goto(`/${FLOW_ROOM_ID}/groups`);

    const leftInputs = page.getByTestId("group-match-goals-left");
    const rightInputs = page.getByTestId("group-match-goals-right");

    await expect(leftInputs.nth(0)).toBeDisabled();
    await expect(rightInputs.nth(0)).toBeDisabled();

    await leftInputs.nth(1).fill("1");
    await rightInputs.nth(1).fill("1");
    await page.getByRole("button", { name: "Guardar" }).first().click();

    await expect(async () => {
      expect(groupsPayload).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(groupsPayload).toEqual({
      matches: [
        {
          matchId: editableMatch.id,
          goalsLeft: 1,
          goalsRight: 1,
        },
      ],
    });
  });
});
