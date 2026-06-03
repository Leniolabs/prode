import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { withNextDev } from "./boot";
import { loadHarnessEnv } from "./env";
import {
  getBaselinePath,
  getScreenshotPath,
  harnessRoutes,
  type HarnessFixtures,
} from "./routes";
import {
  captureRouteScreenshot,
  loginWithDevProvider,
} from "./screenshot";

type Mode = "baseline" | "check";

interface RunResult {
  name: string;
  fileName: string;
  path: string;
  baselinePath: string;
  currentHash: string;
  baselineHash?: string;
  matched: boolean;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let mode: Mode = "check";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mode") {
      const next = argv[++i];
      if (next === "baseline" || next === "check") {
        mode = next;
      }
    }
  }

  return { mode };
}

function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function resolveFixtures(baseUrl: string): Promise<HarnessFixtures> {
  const { prisma } = await import("../src/lib");
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = process.env.HARNESS_USER_EMAIL ?? "playwright@dev.local";

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL must be set to capture the admin baseline");
  }

  const prode = await prisma.prode.findFirst({});
  if (!prode) {
    throw new Error(`No prode was found for the harness at ${baseUrl}`);
  }

  const [adminUser, viewerUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: adminEmail.split("@")[0],
        prodePublic: true,
      },
      update: {
        prodePublic: true,
      },
    }),
    prisma.user.upsert({
      where: { email: userEmail },
      create: {
        email: userEmail,
        name: userEmail.split("@")[0],
        prodePublic: true,
      },
      update: {
        prodePublic: true,
      },
    }),
  ]);

  let room = await prisma.prodeRoom.findFirst({
    where: {
      prodeId: prode.id,
      name: "Harness Room",
    },
    select: {
      id: true,
    },
  });

  if (!room) {
    room = await prisma.prodeRoom.create({
      data: {
        created: new Date("2026-06-01T00:00:00.000Z"),
        userId: adminUser.id,
        prodeId: prode.id,
        name: "Harness Room",
        public: true,
        password: null,
        emailDomain: null,
        pointsWinner: 1,
        pointsGoals: 3,
        pointsPenal: 5,
      },
      select: {
        id: true,
      },
    });
  }

  await prisma.userProde.upsert({
    where: {
      userId_prodeRoomId: {
        userId: viewerUser.id,
        prodeRoomId: room.id,
      },
    },
    create: {
      created: new Date("2026-06-01T00:00:00.000Z"),
      prodeId: prode.id,
      userId: viewerUser.id,
      prodeRoomId: room.id,
    },
    update: {},
  });

  await prisma.userProde.upsert({
    where: {
      userId_prodeRoomId: {
        userId: adminUser.id,
        prodeRoomId: room.id,
      },
    },
    create: {
      created: new Date("2026-06-01T00:00:00.000Z"),
      prodeId: prode.id,
      userId: adminUser.id,
      prodeRoomId: room.id,
    },
    update: {},
  });

  const viewUserProde = await prisma.userProde.findFirst({
    where: { prodeRoomId: room.id, userId: viewerUser.id, template: false },
    select: {
      id: true,
    },
  });

  if (!viewUserProde) {
    throw new Error(`No public user prode was found in room ${room.id} for the harness`);
  }

  return {
    roomId: room.id,
    viewUserProdeId: viewUserProde.id,
  };
}

async function writeOrCompareScreenshot(options: {
  mode: Mode;
  fileName: string;
  capturePath: string;
  hash: string;
}) {
  const baselinePath = resolve(getBaselinePath(options.fileName));
  const currentPath = resolve(options.capturePath);

  if (options.mode === "baseline") {
    mkdirSync(resolve("harness/baseline"), { recursive: true });
    writeFileSync(baselinePath, readFileSync(currentPath));
    return {
      baselineHash: options.hash,
      matched: true,
      baselinePath,
    };
  }

  if (!existsSync(baselinePath)) {
    throw new Error(`Missing baseline: ${baselinePath}`);
  }

  const baselineHash = hashBuffer(readFileSync(baselinePath));
  return {
    baselineHash,
    matched: baselineHash === options.hash,
    baselinePath,
  };
}

async function main() {
  loadHarnessEnv();
  const { mode } = parseArgs();
  const results: RunResult[] = [];

  await withNextDev({
    run: async (baseUrl) => {
    const fixtures = await resolveFixtures(baseUrl);
    const browser = await chromium.launch();
    const viewport = {
      width: 1280,
      height: 800,
    };

    const userContext = await browser.newContext({
      viewport,
      locale: "en-US",
      colorScheme: "light",
      deviceScaleFactor: 1,
    });
    const userEmail =
      process.env.HARNESS_USER_EMAIL ?? "playwright@dev.local";
    await loginWithDevProvider(userContext, baseUrl, userEmail);

    const adminContext = await browser.newContext({
      viewport,
      locale: "en-US",
      colorScheme: "light",
      deviceScaleFactor: 1,
    });
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL must be set to capture the admin baseline");
    }
    await loginWithDevProvider(adminContext, baseUrl, adminEmail);

    const authContexts = {
      public: await browser.newContext({
        viewport,
        locale: "en-US",
        colorScheme: "light",
        deviceScaleFactor: 1,
      }),
      user: userContext,
      admin: adminContext,
    } as const;

    for (const route of harnessRoutes) {
      const context = authContexts[route.auth];
      const outputPath = resolve(getScreenshotPath(route.fileName));
      const path = route.buildPath(fixtures);

      mkdirSync(resolve("harness/screenshots"), { recursive: true });
      const capture = await captureRouteScreenshot({
        context,
        baseUrl,
        route: path,
        output: outputPath,
      });

      const currentHash = hashBuffer(readFileSync(outputPath));
      const comparison = await writeOrCompareScreenshot({
        mode,
        fileName: route.fileName,
        capturePath: outputPath,
        hash: currentHash,
      });

      results.push({
        name: route.name,
        fileName: route.fileName,
        path,
        baselinePath: comparison.baselinePath,
        currentHash,
        baselineHash: comparison.baselineHash,
        matched: comparison.matched,
      });

      process.stdout.write(
        `${mode}: ${route.name} ${capture.status} ${capture.url} -> ${outputPath}\n`
      );
      if (mode === "check") {
        process.stdout.write(
          `hash: ${currentHash}${
            comparison.baselineHash ? ` baseline=${comparison.baselineHash}` : ""
          }\n`
        );
      }
    }

    await browser.close();
    },
  });

  const mismatches = results.filter((result) => !result.matched);
  if (mismatches.length > 0) {
    process.stderr.write("harness:check failed\n");
    for (const mismatch of mismatches) {
      process.stderr.write(
        `- ${mismatch.name}: ${mismatch.path} current=${mismatch.currentHash} baseline=${mismatch.baselineHash ?? "missing"}\n`
      );
    }
    process.exit(1);
  }

  process.stdout.write(
    `${mode}: ${results.length} routes ${mode === "baseline" ? "captured" : "matched"}\n`
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    process.stderr.write(`error: ${err.message ?? err}\n`);
    process.exit(1);
  });
}
