import { test as base, expect } from "@playwright/test";
import { installApiMocks, type MockOverrides } from "./mockApi";

interface E2EFixtures {
  mockApi: (overrides?: MockOverrides) => Promise<void>;
}

export const test = base.extend<E2EFixtures>({
  mockApi: async ({ page }, applyFixture) => {
    let installed = false;
    const installer = async (overrides: MockOverrides = {}) => {
      if (installed) {
        // Allow re-installing with updated overrides mid-test via page.unrouteAll
        await page.unrouteAll({ behavior: "ignoreErrors" });
      }
      await installApiMocks(page, overrides);
      installed = true;
    };
    await applyFixture(installer);
  },
});

export { expect };
