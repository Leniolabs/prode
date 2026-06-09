import { test, expect } from "../support/test";
import { sessionNull, sessionUser } from "../fixtures/auth";

test.describe("Authentication", () => {
  test("root / redirects to /login", async ({ page, mockApi }) => {
    await mockApi({ session: sessionNull });
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows Google sign-in button", async ({ page, mockApi }) => {
    await mockApi({ session: sessionNull });
    await page.goto("/login");
    await expect(page.getByText("Login")).toBeVisible();
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test("authenticated user visiting /login redirects to /rooms", async ({ page, mockApi }) => {
    await mockApi({ session: sessionUser });
    await page.goto("/login");
    await expect(page).toHaveURL(/\/rooms/);
  });

  test("unauthenticated user visiting protected page triggers Google signIn", async ({
    page,
    mockApi,
  }) => {
    // Capture any request to Google OAuth or next-auth signin endpoint.
    const signinRequested = new Promise<string>((resolve) => {
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("accounts.google.com") || url.includes("/api/auth/signin/google")) {
          resolve(url);
        }
      });
    });

    // Block the external Google redirect so the test stays in Playwright control.
    await page.route("**/api/auth/signin/google", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"url":"https://accounts.google.com/mock"}' })
    );
    await page.route("https://accounts.google.com/**", (route) => route.abort());

    await mockApi({ session: sessionNull });
    await page.goto("/rooms");

    const url = await Promise.race([
      signinRequested,
      page.waitForTimeout(4000).then(() => ""),
    ]);
    expect(url).toMatch(/google/i);
  });

  test("blocked user page renders without error", async ({ page, mockApi }) => {
    await mockApi({ session: sessionNull });
    await page.goto("/blocked");
    await expect(page.getByAltText("Qatar Logo")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("500");
  });
});
