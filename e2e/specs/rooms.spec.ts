import { test, expect } from "../support/test";
import { ROOM_ID, ROOM_ID_PW, roomsPageData } from "../fixtures/pageData";

test.describe("Rooms lobby", () => {
  test("renders room list", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/rooms");
    await expect(page.getByText("Mi Prode")).toBeVisible();
    await expect(page.getByText("Sala Privada")).toBeVisible();
  });

  test("shows Create Room button", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/rooms");
    await expect(page.locator('a:has-text("Crea Nuevo Prode")')).toBeVisible();
  });

  test("join open room navigates to /groups", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/rooms");

    await page.getByTestId(`room-enter-${ROOM_ID}`).click();

    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/groups`));
  });

  test("join open room navigates to /finals when finalsStarted", async ({ page, mockApi }) => {
    await mockApi({ roomsPage: roomsPageData({ finalsStarted: true }) });
    await page.goto("/rooms");

    await page.getByTestId(`room-enter-${ROOM_ID}`).click();

    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/finals`));
  });

  test("locked room enter button is disabled", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/rooms");

    await expect(page.getByTestId(`room-enter-${ROOM_ID_PW}`)).toBeDisabled();
  });

  test("password-check page renders the password modal", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto(`/${ROOM_ID_PW}/checkpassword`);
    await expect(page.getByText("Este prode requiere contraseña")).toBeVisible();
  });

  test("correct password navigates to /ranking from the password-check page", async ({ page, mockApi }) => {
    await mockApi({
      checkPassword: { allowed: true },
    });
    await page.goto(`/${ROOM_ID_PW}/checkpassword`);

    await page.getByTestId("password-modal-input").fill("correctPass");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID_PW}/ranking`));
  });
});
