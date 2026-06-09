import { test, expect } from "../support/test";
import { ROOM_ID, roomGroupsData, SUBMISSION_ENDS_PAST } from "../fixtures/pageData";
import { groupMatches } from "../fixtures/matches";

test.describe("Group stage predictions", () => {
  test("renders match inputs for GROUP_A", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    const leftInputs = page.getByTestId("group-match-goals-left");
    await expect(leftInputs.first()).toBeVisible();
  });

  test("save button disabled before any changes", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/groups`);

    // Wait for page data to load
    await expect(page.getByText("GRUPO A")).toBeVisible();
    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await expect(saveBtn).toBeDisabled();
  });

  test("save button enables after entering a score", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    await page.getByTestId("group-match-goals-left").first().fill("2");
    await page.getByTestId("group-match-goals-right").first().fill("1");

    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await expect(saveBtn).toBeEnabled();
  });

  test("autosave POSTs only the changed matches", async ({ page, mockApi }) => {
    let capturedBody: { matches: Array<{ matchId: string; goalsLeft: number; goalsRight: number }> } | null = null;

    await mockApi({
      groupsSave: async (route) => {
        const bodyText = route.request().postData();
        if (bodyText) capturedBody = JSON.parse(bodyText);
        await route.fulfill({ status: 200, contentType: "application/json", body: '{"matches":[]}' });
      },
    });

    await page.goto(`/${ROOM_ID}/groups`);
    await expect(page.getByText("GRUPO A")).toBeVisible();

    // Fill only the first match
    await page.getByTestId("group-match-goals-left").first().fill("2");
    await page.getByTestId("group-match-goals-right").first().fill("0");

    await expect(async () => {
      expect(capturedBody).not.toBeNull();
    }).toPass({ timeout: 4000 });

    expect(capturedBody!.matches).toHaveLength(1);
    expect(capturedBody!.matches[0].matchId).toBe(groupMatches[0].id);
    expect(capturedBody!.matches[0].goalsLeft).toBe(2);
    expect(capturedBody!.matches[0].goalsRight).toBe(0);
  });

  test("inputs are disabled when submission deadline has passed", async ({ page, mockApi }) => {
    await mockApi({
      roomGroups: roomGroupsData({
        submissionEndsAt: SUBMISSION_ENDS_PAST,
        matches: groupMatches.map((m) => ({ ...m, disabled: false })),
      }),
    });
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    const leftInput = page.getByTestId("group-match-goals-left").first();
    await expect(leftInput).toBeDisabled();
  });

  test("Finals Phase button renders without navigation when finals have not started", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    const finalsBtn = page.locator("a", { hasText: "Fase Final" }).first();
    await expect(finalsBtn).not.toHaveAttribute("href", new RegExp(`/${ROOM_ID}/finals`));
  });

  test("Prode List button navigates to /rooms", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    await page.locator('a:has-text("Lista de Prodes")').first().click();
    await expect(page).toHaveURL(/\/rooms/);
  });
});
