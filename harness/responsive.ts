/**
 * Capture full-page screenshots of several routes across a ladder of viewport
 * widths, to eyeball responsive breakpoints. Reuses a running dev server.
 *
 * Usage: tsx harness/responsive.ts
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { withNextDev } from "./boot";
import { loadHarnessEnv } from "./env";
import { loginWithDevProvider } from "./screenshot";

const WIDTHS = [375, 768, 1024, 1440];
const ROUTES = ["/rooms", "/groups", "/finals", "/new-prode", "/admin"];
const USER = "playwright@dev.local";

async function main() {
  loadHarnessEnv();
  await withNextDev({
    run: async (baseUrl) => {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        locale: "en-US",
        colorScheme: "light",
        deviceScaleFactor: 1,
      });
      await loginWithDevProvider(context, baseUrl, USER);

      mkdirSync("harness/screenshots/responsive", { recursive: true });
      const page = await context.newPage();

      for (const route of ROUTES) {
        const slug = route.replace(/^\//, "").replace(/\//g, "-") || "home";
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 900 });
          const res = await page.goto(`${baseUrl}${route}`, {
            waitUntil: "networkidle",
          });
          await page.emulateMedia({
            colorScheme: "light",
            reducedMotion: "reduce",
          });
          const out = `harness/screenshots/responsive/${slug}-${width}.png`;
          await page.screenshot({
            path: out,
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            scale: "css",
          });
          process.stdout.write(`${res?.status()} ${out}\n`);
        }
      }

      await browser.close();
    },
  });
}

main().catch((err) => {
  process.stderr.write(`error: ${err.message ?? err}\n`);
  process.exit(1);
});
