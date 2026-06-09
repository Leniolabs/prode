import { test, expect } from "../support/test";
import { ROOM_ID, ROOM_ID_PW, roomGroupsData, SUBMISSION_ENDS_PAST, USER_PRODE_ID } from "../fixtures/pageData";
import { groupMatches } from "../fixtures/matches";

test.describe("Edge and error scenarios", () => {
  test("wrong password keeps the password-check modal open and shows an error", async ({ page, mockApi }) => {
    await mockApi({
      checkPassword: { allowed: false, code: "WRONG_PASSWORD" },
    });
    await page.goto(`/${ROOM_ID_PW}/checkpassword`);

    await page.getByTestId("password-modal-input").fill("wrongPass");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID_PW}/checkpassword`));
    await expect(page.locator('[role="alert"]').filter({ hasText: "contraseña" })).toBeVisible();
  });

  test("email domain mismatch shows the domain-specific error", async ({ page, mockApi }) => {
    await mockApi({
      checkPassword: { allowed: false, code: "EMAIL_DOMAIN" },
    });
    await page.goto(`/${ROOM_ID_PW}/checkpassword`);

    await page.getByTestId("password-modal-input").fill("anyPass");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID_PW}/checkpassword`));
    await expect(page.locator('[role="alert"]').filter({ hasText: "dominio" })).toBeVisible();
  });

  test("submissions ended: save button stays disabled", async ({ page, mockApi }) => {
    await mockApi({
      roomGroups: roomGroupsData({
        submissionEndsAt: SUBMISSION_ENDS_PAST,
        matches: groupMatches,
      }),
    });
    await page.goto(`/${ROOM_ID}/groups`);

    await expect(page.getByText("GRUPO A")).toBeVisible();
    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await expect(saveBtn).toBeDisabled();
  });

  test("leave room: dismissing confirm keeps user on ranking page", async ({ page, mockApi }) => {
    let deleteCalled = false;
    await mockApi({
      roomLeave: async (route) => {
        deleteCalled = true;
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      },
    });

    page.on("dialog", (dialog) => dialog.dismiss());

    await page.goto(`/${ROOM_ID}/ranking`);
    await expect(page.getByText("Alice")).toBeVisible();

    await page.locator('button:has-text("Abandonar")').click();

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/ranking`));
    expect(deleteCalled).toBe(false);
  });

  test("room-groups-data redirect body navigates to checkpassword", async ({ page, mockApi }) => {
    await mockApi({ roomGroups: { redirect: `/${ROOM_ID}/checkpassword` } });

    await page.goto(`/${ROOM_ID}/groups`);
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/checkpassword`));
  });

  test("room-finals-data redirect body navigates back to groups", async ({ page, mockApi }) => {
    await mockApi({ roomFinals: { redirect: `/${ROOM_ID}/groups` } });

    await page.goto(`/${ROOM_ID}/finals`);
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/groups`));
  });

  test("view-page-data redirect body navigates back to rooms", async ({ page, mockApi }) => {
    await mockApi({ viewPage: { redirect: "/rooms" } });

    await page.goto(`/${USER_PRODE_ID}/view`);
    await expect(page).toHaveURL(/\/rooms/);
  });
});
