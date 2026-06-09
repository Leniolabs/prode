import { test, expect } from "../support/test";
import { sessionAdmin } from "../fixtures/auth";
import { ROOM_ID, USER_ID, adminPageData } from "../fixtures/pageData";

test.describe("Admin flows", () => {
  test.beforeEach(async ({ page }) => {
    // Admin routes require sign-in — session is still mocked, but we use sessionAdmin
    // so the admin email can be verified client-side if needed.
    void page; // accessed via mockApi fixture per test
  });

  test("admin dashboard shows stats from mock data", async ({ page, mockApi }) => {
    await mockApi({ session: sessionAdmin });
    // Register after mockApi so this route takes priority over the catch-all
    await page.route("**/api/admin-page-data", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(adminPageData()) })
    );
    await page.goto("/admin");

    await expect(page.getByText("50")).toBeVisible(); // userCount
    await expect(page.getByText("10")).toBeVisible(); // roomCount
    await expect(page.getByText("Mi Prode")).toBeVisible();
    await expect(page.getByText("Alice", { exact: true })).toBeVisible();
  });

  test("RESET MATCHES sends POST after confirm", async ({ page, mockApi }) => {
    let resetCalled = false;

    await mockApi({
      session: sessionAdmin,
      adminReset: {},
    });
    await page.route("**/api/admin/reset", async (route) => {
      resetCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin");
    await page.locator('button:has-text("RESET MATCHES")').click();

    await expect(async () => expect(resetCalled).toBe(true)).toPass({ timeout: 3000 });
  });

  test("RESET MATCHES does NOT call API when confirm is dismissed", async ({ page, mockApi }) => {
    let resetCalled = false;

    await mockApi({ session: sessionAdmin });
    await page.route("**/api/admin/reset", async (route) => {
      resetCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.dismiss());

    await page.goto("/admin");
    await page.locator('button:has-text("RESET MATCHES")').click();

    await page.waitForTimeout(500);
    expect(resetCalled).toBe(false);
  });

  test("PRUNE DB sends POST after confirm", async ({ page, mockApi }) => {
    let pruneCalled = false;

    await mockApi({
      session: sessionAdmin,
      adminPrune: {},
    });
    await page.route("**/api/admin/prune", async (route) => {
      pruneCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin");
    await page.locator('button:has-text("PRUNE DB")').click();

    await expect(async () => expect(pruneCalled).toBe(true)).toPass({ timeout: 3000 });
  });

  test("PRUNE DB does NOT call API when confirm is dismissed", async ({ page, mockApi }) => {
    let pruneCalled = false;

    await mockApi({ session: sessionAdmin });
    await page.route("**/api/admin/prune", async (route) => {
      pruneCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.dismiss());

    await page.goto("/admin");
    await page.locator('button:has-text("PRUNE DB")').click();

    await page.waitForTimeout(500);
    expect(pruneCalled).toBe(false);
  });

  test("block user sends POST to correct URL", async ({ page, mockApi }) => {
    let capturedUrl = "";

    await mockApi({ session: sessionAdmin });
    // Register after mockApi so this route takes priority over the catch-all
    await page.route("**/api/admin-page-data", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(adminPageData()) })
    );
    await page.route("**/api/admin/users/*/block", async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin");
    await expect(page.getByText("Alice", { exact: true })).toBeVisible();

    // Find the USERS card (contains "Block" column header) and click its first ButtonIcon
    const userTable = page.locator('[class*="card"]').filter({ hasText: "Block" });
    await userTable.locator('[class*="buttonIcon"]').first().click();

    await expect(async () => expect(capturedUrl).toContain(`/api/admin/users/${USER_ID}/block`)).toPass({ timeout: 3000 });
  });

  test("delete room sends POST to correct URL", async ({ page, mockApi }) => {
    let capturedUrl = "";

    await mockApi({ session: sessionAdmin });
    // Register after mockApi so this route takes priority over the catch-all
    await page.route("**/api/admin-page-data", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(adminPageData()) })
    );
    await page.route("**/api/admin/rooms/*/delete", async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/admin");
    await expect(page.getByText("Mi Prode")).toBeVisible();

    // Find the rooms card (contains "Delete" column header) and click its first ButtonIcon
    const roomTable = page.locator('[class*="card"]').filter({ hasText: "Delete" });
    await roomTable.locator('[class*="buttonIcon"]').first().click();

    await expect(async () => expect(capturedUrl).toContain(`/api/admin/rooms/${ROOM_ID}/delete`)).toPass({ timeout: 3000 });
  });

  test("admin finals page shows bracket matches", async ({ page, mockApi }) => {
    await mockApi({ session: sessionAdmin });
    await page.goto("/admin/finals");

    await expect(page.locator('button:has-text("Start Finals")')).toBeVisible();
  });

  test("admin finals save posts the edited official results", async ({ page, mockApi }) => {
    let capturedBody: {
      matches: Array<{
        id: string;
        countryLeftId: string;
        countryRightId: string;
        goalsLeft: number;
        goalsRight: number;
      }>;
    } | null = null;

    await mockApi({ session: sessionAdmin });
    await page.route("**/api/admin/finals", async (route) => {
      const raw = route.request().postData();
      if (raw) capturedBody = JSON.parse(raw);
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"matches":[]}' });
    });

    await page.goto("/admin/finals");
    await page.getByTestId("finals-match-goals-left").first().fill("2");
    await page.getByTestId("finals-match-goals-right").first().fill("1");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(async () => {
      expect(capturedBody).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(capturedBody!.matches[0]).toMatchObject({
      id: "clfinalmatch1",
      countryLeftId: "clcountry1",
      countryRightId: "clcountry2",
      goalsLeft: 2,
      goalsRight: 1,
    });
  });

  test("Start Finals sends POST", async ({ page, mockApi }) => {
    let startCalled = false;

    await mockApi({ session: sessionAdmin });
    await page.route("**/api/admin/finals-start", async (route) => {
      startCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/admin/finals");
    await page.locator('button:has-text("Start Finals")').click();

    await expect(async () => expect(startCalled).toBe(true)).toPass({ timeout: 3000 });
  });
});
