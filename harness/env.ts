import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const harnessDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(harnessDir, "..");

let envLoaded = false;

function parseEnvFile(content: string) {
  const parsed: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const cleaned = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = cleaned.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = cleaned.slice(0, separatorIndex).trim();
    if (!key) continue;

    let value = cleaned.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    parsed[key] = value;
  }

  return parsed;
}

export function loadHarnessEnv() {
  if (envLoaded) return;

  const keysDefinedBeforeLoad = new Set(Object.keys(process.env));
  const envFiles = [".env", ".env.local"];

  for (const relativePath of envFiles) {
    const filePath = resolve(repoRoot, relativePath);
    if (!existsSync(filePath)) continue;

    const parsed = parseEnvFile(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (keysDefinedBeforeLoad.has(key)) continue;
      process.env[key] = value;
    }
  }

  envLoaded = true;
}

export function getHarnessBaseUrl() {
  return process.env.HARNESS_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
