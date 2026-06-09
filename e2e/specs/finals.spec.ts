import { test, expect } from "../support/test";
import { ROOM_ID, roomFinalsData } from "../fixtures/pageData";

test.describe("Finals predictions", () => {
  test("renders bracket when finals are active", async ({ page, mockApi }) => {
    await mockApi({ roomFinals: roomFinalsData({ finalsStarted: true }) });
    await page.goto(`/${ROOM_ID}/finals`);

    await expect(page.getByText(/FINALES|DIECISEISAVOS|TREINTAIDOSAVOS/).first()).toBeVisible();
  });

  test("save button disabled before entering any prediction", async ({ page, mockApi }) => {
    await mockApi({ roomFinals: roomFinalsData({ finalsStarted: true }) });
    await page.goto(`/${ROOM_ID}/finals`);

    await expect(page.getByText(/FINALES|DIECISEISAVOS|TREINTAIDOSAVOS/).first()).toBeVisible();
    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await expect(saveBtn).toBeDisabled();
  });

  test("save POSTs prediction body with 201", async ({ page, mockApi }) => {
    let capturedBody: {
      matches: Array<{
        matchId: string;
        goalsLeft: number;
        goalsRight: number;
        countryLeftId: string;
        countryRightId: string;
        penaltisLeft: number;
        penaltisRight: number;
      }>;
    } | null = null;

    await mockApi({
      roomFinals: roomFinalsData({ finalsStarted: true }),
      finalsSave: async (route) => {
        const bodyText = route.request().postData();
        if (bodyText) capturedBody = JSON.parse(bodyText);
        await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
      },
    });

    await page.goto(`/${ROOM_ID}/finals`);
    await expect(page.getByText(/FINALES|DIECISEISAVOS|TREINTAIDOSAVOS/).first()).toBeVisible();

    await page.getByTestId("finals-match-goals-left").first().fill("1");
    await page.getByTestId("finals-match-goals-right").first().fill("1");
    await page.getByTestId("finals-match-penalties-left").first().fill("4");
    await page.getByTestId("finals-match-penalties-right").first().fill("3");

    await page.locator('button:has-text("Guardar")').first().click();

    await expect(async () => {
      expect(capturedBody).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(capturedBody!.matches[0]).toMatchObject({
      matchId: "clfinalmatch1",
      goalsLeft: 1,
      goalsRight: 1,
      countryLeftId: "clcountry1",
      countryRightId: "clcountry2",
      penaltisLeft: 4,
      penaltisRight: 3,
    });
  });

  test("Group Phase button navigates to /groups", async ({ page, mockApi }) => {
    await mockApi({ roomFinals: roomFinalsData({ finalsStarted: true }) });
    await page.goto(`/${ROOM_ID}/finals`);

    await expect(page.getByText(/FINALES|DIECISEISAVOS|TREINTAIDOSAVOS/).first()).toBeVisible();
    await page.locator('a:has-text("Fase de Grupos"), button:has-text("Fase de Grupos")').first().click();
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/groups`));
  });
});
