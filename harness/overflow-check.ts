// Diagnostic: report elements whose right edge exceeds the viewport width
// (causes horizontal scroll / 100vw overflow). Authed, room-scoped.
import { chromium } from "playwright";
import { withNextDev } from "./boot";
import { loadHarnessEnv } from "./env";
import { loginWithDevProvider } from "./screenshot";

async function main() {
  loadHarnessEnv();
  const route = process.argv[2] ?? "/cmq8ifx9d0003jtymwo4433oe/groups";
  const width = parseInt(process.argv[3] ?? "430", 10);

  await withNextDev({
    run: async (baseUrl) => {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        locale: "en-US",
      });
      await loginWithDevProvider(context, baseUrl, "playwright@dev.local");
      const page = await context.newPage();
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      const report = await page.evaluate((vw) => {
        const out: { sel: string; right: number; width: number; cls: string }[] = [];
        const docW = document.documentElement.scrollWidth;
        document.querySelectorAll<HTMLElement>("*").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.width > vw + 1) {
            const cls = typeof el.className === "string" ? el.className : "";
            out.push({
              sel: el.tagName.toLowerCase(),
              right: Math.round(r.right),
              width: Math.round(r.width),
              cls: cls.slice(0, 80),
            });
          }
        });
        return { docW, vw, count: out.length, offenders: out.slice(0, 40) };
      }, width);

      console.log(JSON.stringify(report, null, 2));
      await browser.close();
    },
  });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
