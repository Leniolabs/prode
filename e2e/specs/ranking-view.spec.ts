import { test, expect } from "../support/test";
import { ROOM_ID, USER_PRODE_ID, roomRankingData } from "../fixtures/pageData";

test.describe("Ranking and user view", () => {
  test("ranking page shows player rows", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/ranking`);

    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
  });

  test("ranking shows total players count", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/ranking`);

    await expect(page.getByText("Jugadores totales: 2")).toBeVisible();
  });

  test("pagination renders when there is more than one page", async ({ page, mockApi }) => {
    await mockApi({ roomRanking: roomRankingData({ totalPages: 2, totalPlayers: 31 }) });
    await page.goto(`/${ROOM_ID}/ranking`);

    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.locator('[class*="paginationNumber"]').first()).toContainText("1 / 2");
  });

  test("clicking a player row navigates to /{userProdeId}/view", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/ranking`);

    await expect(page.getByText("Bob")).toBeVisible();

    // The second row corresponds to Bob (cluserprode2)
    // Table uses styles.clickable on clickable rows; fall back to tbody tr
    await page.locator('[class*="clickable"], tbody tr').nth(1).click();
    await expect(page).toHaveURL(/\/cluserprode2\/view/);
  });

  test("leave room confirm accepted sends DELETE and navigates to /rooms", async ({
    page,
    mockApi,
  }) => {
    let deleteRequested = false;

    await mockApi({
      roomLeave: async (route) => {
        deleteRequested = true;
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      },
    });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto(`/${ROOM_ID}/ranking`);
    await expect(page.getByText("Alice")).toBeVisible();

    await page.locator('button:has-text("Abandonar")').click();

    await expect(page).toHaveURL(/\/rooms/);
    expect(deleteRequested).toBe(true);
  });

  test("leave room confirm dismissed keeps user on ranking", async ({ page, mockApi }) => {
    let deleteRequested = false;

    await mockApi({
      roomLeave: async (route) => {
        deleteRequested = true;
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      },
    });

    page.on("dialog", (dialog) => dialog.dismiss());

    await page.goto(`/${ROOM_ID}/ranking`);
    await expect(page.getByText("Alice")).toBeVisible();

    await page.locator('button:has-text("Abandonar")').click();

    // No navigation should occur
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/ranking`));
    expect(deleteRequested).toBe(false);
  });

  test("view page shows read-only inputs for another user's predictions", async ({
    page,
    mockApi,
  }) => {
    await mockApi();
    await page.goto(`/${USER_PRODE_ID}/view`);

    // Should show the viewed user's name
    await expect(page.getByText("Bob")).toBeVisible();

    // All goal inputs must be disabled
    const leftInputs = page.getByTestId("group-match-goals-left");
    const count = await leftInputs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(leftInputs.nth(i)).toBeDisabled();
    }
  });

  test("private or missing public prode redirects back to /rooms", async ({ page, mockApi }) => {
    await mockApi({ viewPage: { redirect: "/rooms" } });
    await page.goto(`/${USER_PRODE_ID}/view`);
    await expect(page).toHaveURL(/\/rooms/);
  });
});
