import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  use: {
    baseURL: process.env.HARNESS_BASE_URL ?? "http://127.0.0.1:3000",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    colorScheme: "light",
    deviceScaleFactor: 1,
  },
});
