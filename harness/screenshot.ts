/**
 * Take a screenshot of a route on the running Next.js dev server.
 *
 * Usage:
 *   tsx harness/screenshot.ts <route> [--output <path>] [--no-auth] [--user <email>]
 *
 * Examples:
 *   tsx harness/screenshot.ts /
 *   tsx harness/screenshot.ts /rooms --output harness/screenshots/rooms.png
 *   tsx harness/screenshot.ts /admin --user admin@dev.local
 *   tsx harness/screenshots.ts /login --no-auth
 *
 * Defaults:
 *   - Authenticates via the dev provider (NextAuth CredentialsProvider id: "dev")
 *     as playwright@dev.local unless --no-auth is passed.
 *   - Saves to harness/screenshots/<route-slug>.png unless --output is passed.
 *   - Requires the Next.js dev server on http://localhost:3000.
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname } from "path";

interface Args {
  route: string;
  output: string;
  auth: boolean;
  user: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let output: string | undefined;
  let auth = true;
  let user = "playwright@dev.local";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--output") {
      output = argv[++i];
    } else if (a === "--no-auth") {
      auth = false;
    } else if (a === "--user") {
      user = argv[++i];
    } else {
      positional.push(a);
    }
  }

  const route = positional[0] ?? "/";
  if (!output) {
    const slug =
      route === "/"
        ? "home"
        : route
            .replace(/^\//, "")
            .replace(/\//g, "-")
            .replace(/[\[\]]/g, "")
            .replace(/\?.*$/, "");
    output = `harness/screenshots/${slug}.png`;
  }

  return { route, output, auth, user };
}

async function login(
  context: import("playwright").BrowserContext,
  email: string
) {
  const baseUrl = "http://localhost:3000";
  const csrfRes = await context.request.get(`${baseUrl}/api/auth/csrf`);
  if (!csrfRes.ok()) {
    throw new Error(`CSRF fetch failed: ${csrfRes.status()}`);
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const callbackRes = await context.request.post(
    `${baseUrl}/api/auth/callback/dev`,
    {
      form: {
        csrfToken,
        email,
        callbackUrl: `${baseUrl}/`,
        json: "true",
      },
    }
  );
  if (!callbackRes.ok() && callbackRes.status() !== 302) {
    throw new Error(`Dev login failed: ${callbackRes.status()}`);
  }
}

async function main() {
  const args = parseArgs();
  const url = `http://localhost:3000${args.route}`;
  mkdirSync(dirname(args.output), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  if (args.auth) {
    process.stdout.write(`auth: signing in as ${args.user}\n`);
    await login(context, args.user);
  }

  const page = await context.newPage();
  process.stdout.write(`navigating: ${url}\n`);
  const response = await page.goto(url, { waitUntil: "networkidle" });
  if (!response) {
    throw new Error(`No response from ${url}`);
  }
  process.stdout.write(`response: ${response.status()} ${response.url()}\n`);

  await page.screenshot({ path: args.output, fullPage: true });
  process.stdout.write(`saved: ${args.output}\n`);

  await browser.close();
}

main().catch((err) => {
  process.stderr.write(`error: ${err.message ?? err}\n`);
  process.exit(1);
});
