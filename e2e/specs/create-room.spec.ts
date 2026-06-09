import { test, expect } from "../support/test";
import { ROOM_ID } from "../fixtures/pageData";

test.describe("Create room", () => {
  test("save button disabled with empty name", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/new-prode");

    const saveButton = page.locator('button:has-text("Guardar")');
    await expect(saveButton).toBeDisabled();
  });

  test("save button enables after typing a valid name", async ({ page, mockApi }) => {
    await mockApi({ checkRoomName: { allowed: true } });
    await page.goto("/new-prode");

    await page.locator('input[placeholder="Nuevo Prode 1"]').fill("Mi Nuevo Prode");
    await page.waitForTimeout(400); // debounce

    const saveButton = page.locator('button:has-text("Guardar")');
    await expect(saveButton).toBeEnabled();
  });

  test("taken name shows error and keeps save disabled", async ({ page, mockApi }) => {
    await mockApi({ checkRoomName: { allowed: false } });
    await page.goto("/new-prode");

    await page.locator('input[placeholder="Nuevo Prode 1"]').fill("Nombre Existente");
    await page.waitForTimeout(400);

    await expect(page.getByText("Name already taken")).toBeVisible();
    await expect(page.locator('button:has-text("Guardar")')).toBeDisabled();
  });

  test("happy path: POSTs form data and redirects to /{id}/ranking", async ({
    page,
    mockApi,
  }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await mockApi({
      checkRoomName: { allowed: true },
      createRoom: { id: ROOM_ID },
      groupsSave: undefined,
    });

    // Override create to capture the request body before fulfilling.
    await page.route("**/api/create", async (route) => {
      const bodyText = route.request().postData();
      if (bodyText) capturedBody = JSON.parse(bodyText);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: ROOM_ID }),
      });
    });

    await page.goto("/new-prode");
    await page.locator('input[placeholder="Nuevo Prode 1"]').fill("Mi Nuevo Prode");
    await page.getByLabel("Contraseña").fill("clave-secreta");
    await page.getByLabel("Puntos por ganador de partido").fill("7");
    await page.getByLabel("Puntos por goles").fill("4");
    await page.getByLabel("Puntos por penales").fill("2");
    await page.waitForTimeout(400);

    await page.locator('button:has-text("Guardar")').click();
    await expect(page).toHaveURL(new RegExp(`/${ROOM_ID}/ranking`));

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.name).toBe("Mi Nuevo Prode");
    expect(capturedBody!.password).toBe("clave-secreta");
    expect(capturedBody!.pointsWinner).toBe(7);
    expect(capturedBody!.pointsGoals).toBe(4);
    expect(capturedBody!.pointsPenal).toBe(2);
  });

  test("cancel button navigates to /rooms", async ({ page, mockApi }) => {
    await mockApi();
    await page.goto("/new-prode");

    await page.locator('a:has-text("Cancelar")').click();
    await expect(page).toHaveURL(/\/rooms/);
  });
});
