import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { setTimeout as delay } from "timers/promises";
import { loadHarnessEnv, getHarnessBaseUrl, repoRoot } from "./env";

type WithNextDevOptions<T> = {
  run: (baseUrl: string) => Promise<T>;
  timeoutMs?: number;
};

async function waitForHttp(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response) return;
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(
    `Timed out waiting for Next dev at ${url}${
      lastError instanceof Error ? `: ${lastError.message}` : ""
    }`
  );
}

function relayOutput(prefix: string, chunk: Buffer) {
  const text = chunk.toString("utf8");
  for (const line of text.split(/\r?\n/)) {
    if (line) process.stdout.write(`${prefix}${line}\n`);
  }
}

export async function withNextDev<T>({
  run,
  timeoutMs = 120000,
}: WithNextDevOptions<T>) {
  loadHarnessEnv();
  const baseUrl = getHarnessBaseUrl();

  try {
    await waitForHttp(baseUrl, 1000);
    return await run(baseUrl);
  } catch {
    // Start the local dev server only when it is not already reachable.
  }

  mkdirSync(resolve(repoRoot, ".next"), { recursive: true });

  const dev = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1"],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  dev.stdout?.on("data", (chunk) => relayOutput("[dev] ", chunk));
  dev.stderr?.on("data", (chunk) => relayOutput("[dev] ", chunk));

  const exitPromise = new Promise<never>((_, reject) => {
    dev.once("exit", (code, signal) => {
      reject(
        new Error(
          `Next dev exited before the harness completed (code=${code}, signal=${signal ?? "null"})`
        )
      );
    });
  });

  await Promise.race([waitForHttp(baseUrl, timeoutMs), exitPromise]);

  try {
    return await run(baseUrl);
  } finally {
    if (!dev.killed) {
      dev.kill("SIGTERM");
      await Promise.race([
        new Promise<void>((resolveWait) => dev.once("close", () => resolveWait())),
        delay(5000),
      ]);
    }
  }
}

