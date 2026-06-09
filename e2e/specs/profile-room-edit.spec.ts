import { test, expect } from "../support/test";
import { ROOM_ID, roomGroupsData } from "../fixtures/pageData";

test.describe("Profile editing", () => {
  test("opens profile modal and saves with PATCH /api/profile", async ({ page, mockApi }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await mockApi({
      profile: {},
    });
    // Intercept only PATCH — GET requests fall through to mockApi's handler
    await page.route("**/api/profile", async (route) => {
      if (route.request().method() === "PATCH") {
        const raw = route.request().postData();
        if (raw) capturedBody = JSON.parse(raw);
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/${ROOM_ID}/groups`);
    await expect(page.getByText("GRUPO A")).toBeVisible();

    // Click the header avatar/cog area to open the profile modal
    await page.getByTestId("header-menu").first().click();

    // Profile modal should appear
    await expect(page.getByText("MI PERFIL")).toBeVisible();

    // The name input in the profile modal is a plain <input> (no type attribute).
    // Scope to the dialog to avoid matching hidden file inputs.
    const dialog = page.getByRole("dialog");
    const nameInput = dialog.getByTestId("profile-name-input");
    await nameInput.click({ clickCount: 3 }); // select all
    await nameInput.fill("Alice Updated");

    await dialog.getByRole("switch", { name: "Mi prode es público" }).click();
    await dialog.getByRole("switch", { name: "Modo oscuro" }).click();
    await dialog.getByTestId("profile-background-select").selectOption("background-2");

    // Save — the save button is inside the same dialog
    await dialog.getByRole("button", { name: "Guardar" }).click();

    // Profile PATCH should have been called
    await expect(async () => {
      expect(capturedBody).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(capturedBody).toMatchObject({
      name: "Alice Updated",
      prodePublic: false,
      dark: true,
      background: "background-2",
    });
  });
});

test.describe("Room editing (admin)", () => {
  test("opens room edit modal and saves with PUT /api/{id}/update", async ({ page, mockApi }) => {
    let capturedBody: Record<string, unknown> | null = null;
    let capturedUrl = "";

    await mockApi({
      roomGroups: roomGroupsData({ roomAdmin: true }),
    });

    // The mockApi catch-all intercepts room-groups-data before the function-predicate
    // route can match. Register the overridden data route after mockApi so it takes
    // priority (Playwright routes are LIFO).
    await page.route("**/api/room-groups-data*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(roomGroupsData({ roomAdmin: true })),
      })
    );

    // Override the update route to capture body
    await page.route("**/api/*/update", async (route) => {
      capturedUrl = route.request().url();
      const raw = route.request().postData();
      if (raw) capturedBody = JSON.parse(raw);
      await route.fulfill({ status: 200, contentType: "application/json", body: `{"id":"${ROOM_ID}"}` });
    });

    await page.goto(`/${ROOM_ID}/groups`);
    await expect(page.getByText("GRUPO A")).toBeVisible();

    // Wait for the room name to appear in the header (confirms data loaded with roomAdmin: true)
    await expect(page.getByText("Mi Prode")).toBeVisible();

    // The pencil ButtonIcon is inside the prode-title section of the header message.
    // Scope to headerMessageTitleHighlighted to avoid matching other buttonIcon elements.
    const pencilButton = page.locator('[class*="headerMessageTitleHighlighted"] [class*="buttonIcon"]');
    await pencilButton.click();

    // Edit room modal title uses i18n.editTitle which prepends room name
    await expect(page.getByText(/EDITANDO PRODE/i)).toBeVisible();

    const dialog = page.getByRole("dialog");
    const nameInput = dialog.getByLabel("Nombre");
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill("Mi Prode Editado");
    await dialog.getByLabel("Contraseña").fill("nueva-clave");
    await dialog.getByRole("switch", { name: "Mi prode es público" }).click();
    await dialog.getByLabel("Puntos por ganador de partido").fill("8");
    await dialog.getByLabel("Puntos por goles").fill("5");
    await dialog.getByLabel("Puntos por penales").fill("3");

    // Save the edit
    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(async () => {
      expect(capturedBody).not.toBeNull();
    }).toPass({ timeout: 3000 });

    expect(capturedUrl).toContain(`/api/${ROOM_ID}/update`);
    expect(capturedBody).toMatchObject({
      name: "Mi Prode Editado",
      password: "nueva-clave",
      public: false,
      pointsWinner: 8,
      pointsGoals: 5,
      pointsPenal: 3,
    });
  });
});
