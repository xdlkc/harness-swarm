import { existsSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HARNESS_NAMES, type HarnessName } from "./types.js";

/**
 * User-level locations each harness reads for global rules and skills, relative to the home directory.
 * `root` decides whether the harness counts as configured on this machine.
 */
export interface AgentHome {
  root: string;
  rules: string;
  skills: string;
}

export const AGENT_HOMES: Record<HarnessName, AgentHome | null> = {
  qoder: { root: ".qoder", rules: ".qoder/AGENTS.md", skills: ".qoder/skills" },
  kimi: { root: ".kimi-code", rules: ".kimi-code/AGENTS.md", skills: ".kimi-code/skills" },
  pi: { root: ".pi/agent", rules: ".pi/agent/AGENTS.md", skills: ".pi/agent/skills" },
  grok: { root: ".grok", rules: ".grok/AGENTS.md", skills: ".grok/skills" },
  codex: { root: ".codex", rules: ".codex/AGENTS.md", skills: ".codex/skills" },
  claude: { root: ".claude", rules: ".claude/CLAUDE.md", skills: ".claude/skills" },
  // DSH configures instructions through profiles and has no user-level rules or skills directory.
  dsh: null,
  opencode: { root: ".config/opencode", rules: ".config/opencode/AGENTS.md", skills: ".config/opencode/skills" },
  opencode2: { root: ".config/opencode", rules: ".config/opencode/AGENTS.md", skills: ".config/opencode/skills" },
};

export interface AssetOpts {
  /** Home directory that holds the harness config dirs (defaults to the user home). */
  home?: string;
  /** Root of this package, which holds `assets/` (defaults to the installed package). */
  packageRoot?: string;
}

export function homeDir(opts: AssetOpts): string {
  return opts.home ?? os.homedir();
}

/** Resolved through `npm link` so symlinks point at the real checkout, not the global node_modules link. */
export function packageRoot(opts: AssetOpts): string {
  return opts.packageRoot ?? realpathSync(fileURLToPath(new URL("../..", import.meta.url)));
}

/** Explicit names must support assets; otherwise pick every supported harness whose config root exists. */
export function selectHarnesses(names: HarnessName[] | undefined, opts: AssetOpts): HarnessName[] {
  if (names && names.length > 0) {
    for (const name of names) {
      if (AGENT_HOMES[name] === null) throw new Error(`${name} has no user-level rules or skills directory`);
    }
    return [...new Set(names)];
  }
  const home = homeDir(opts);
  return HARNESS_NAMES.filter((name) => {
    const entry = AGENT_HOMES[name];
    return entry !== null && existsSync(path.join(home, entry.root));
  });
}

/** Group harnesses that share one target path (opencode and opencode2 share ~/.config/opencode). */
export function groupTargets(harnesses: HarnessName[], key: "rules" | "skills", opts: AssetOpts): Map<string, HarnessName[]> {
  const home = homeDir(opts);
  const targets = new Map<string, HarnessName[]>();
  for (const name of harnesses) {
    const entry = AGENT_HOMES[name];
    if (entry === null) continue;
    const target = path.join(home, entry[key]);
    targets.set(target, [...(targets.get(target) ?? []), name]);
  }
  return targets;
}
