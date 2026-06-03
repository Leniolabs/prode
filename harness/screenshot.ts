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
 */

import { chromium, type BrowserContext } from "playwright";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { withNextDev } from "./boot";
import { getHarnessBaseUrl, loadHarnessEnv } from "./env";

export interface ScreenshotArgs {
  route: string;
  output: string;
  auth: boolean;
  user: string;
}

export async function loginWithDevProvider(
  context: BrowserContext,
  baseUrl: string,
  email: string
) {
  const { prisma } = await import("../src/lib");
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: email.split("@")[0],
      prodePublic: true,
    },
    update: {
      prodePublic: true,
    },
  });

  const csrfResponse = await context.request.get(`${baseUrl}/api/auth/csrf`);
  if (!csrfResponse.ok()) {
    throw new Error(
      `Failed to prime harness auth cookies: ${csrfResponse.status()}`
    );
  }

  const callbackResponse = await context.request.post(
    `${baseUrl}/api/harness/signin`,
    {
      data: {
        email: user.email ?? email,
      },
    }
  );

  if (!callbackResponse.ok()) {
    throw new Error(
      `Harness auth failed for ${email}: ${callbackResponse.status()}`
    );
  }

  const callbackPayload = (await callbackResponse.json()) as {
    token?: string;
    cookieName?: string;
  };
  if (!callbackPayload.token || !callbackPayload.cookieName) {
    throw new Error("Harness auth did not return a session token");
  }

  await context.addCookies([
    {
      name: callbackPayload.cookieName,
      value: callbackPayload.token,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "next-auth.callback-url",
      value: "/",
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

}

export async function captureRouteScreenshot(options: {
  context: BrowserContext;
  baseUrl: string;
  route: string;
  output: string;
}) {
  const page = await options.context.newPage();
  try {
    const url = `${options.baseUrl}${options.route}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    if (!response) {
      throw new Error(`No response from ${url}`);
    }

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    mkdirSync(dirname(options.output), { recursive: true });
    await page.screenshot({
      path: options.output,
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });

    return {
      status: response.status(),
      url: response.url(),
    };
  } finally {
    await page.close();
  }
}

function parseArgs(): ScreenshotArgs {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let output: string | undefined;
  let auth = true;
  let user = "playwright@dev.local";

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--output") {
      output = argv[++i];
    } else if (current === "--no-auth") {
      auth = false;
    } else if (current === "--user") {
      user = argv[++i];
    } else {
      positional.push(current);
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

async function main() {
  loadHarnessEnv();
  const args = parseArgs();

  await withNextDev({
    run: async (baseUrl) => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
      colorScheme: "light",
      deviceScaleFactor: 1,
    });

    if (args.auth) {
      process.stdout.write(`auth: signing in as ${args.user}\n`);
      await loginWithDevProvider(context, baseUrl, args.user);
    }

    process.stdout.write(`navigating: ${baseUrl}${args.route}\n`);
    const result = await captureRouteScreenshot({
      context,
      baseUrl,
      route: args.route,
      output: args.output,
    });
    process.stdout.write(
      `response: ${result.status} ${result.url}\nsaved: ${args.output}\n`
    );

    await browser.close();
    },
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    process.stderr.write(`error: ${err.message ?? err}\n`);
    process.exit(1);
  });
}
