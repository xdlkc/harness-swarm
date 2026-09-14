import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { HARNESS_BINARIES, HARNESS_NAMES, type HarnessName, type HarnessStatus } from "./types.js";
import { HARNESS_CAPABILITIES } from "./capabilities.js";

const VERSION_ARGS: Record<HarnessName, string[]> = {
  qoder: ["-v"],
  kimi: ["-V"],
  pi: ["--version"],
  grok: ["--version"],
  codex: ["--version"],
  claude: ["--version"],
  dsh: ["--version"],
  opencode: ["--version"],
};

export function which(binary: string, envPath?: string): string | null {
  if (path.isAbsolute(binary) && existsSync(binary)) {
    return binary;
  }
  const pathEnv = envPath ?? process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) {
      continue;
    }
    const candidate = path.join(dir, binary);
    try {
      const st = statSync(candidate);
      if (st.isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function readVersion(binaryPath: string, name: HarnessName): string | null {
  const result = spawnSync(binaryPath, VERSION_ARGS[name], {
    encoding: "utf8",
    timeout: 15_000,
  });
  const text = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (!text) {
    return null;
  }
  const first = text.split(/\r?\n/).find((line) => line.trim().length > 0);
  return first ? first.trim() : null;
}

export function listHarnesses(envPath?: string): HarnessStatus[] {
  return HARNESS_NAMES.map((name) => {
    const binary = HARNESS_BINARIES[name];
    const resolved = which(binary, envPath);
    if (!resolved) {
      return { name, binary, installed: false, path: null, version: null, capabilities: HARNESS_CAPABILITIES[name] };
    }
    const version = readVersion(resolved, name) || "unknown";
    return {
      name,
      binary,
      installed: true,
      path: resolved,
      version,
      capabilities: HARNESS_CAPABILITIES[name],
    };
  });
}
