export const HARNESS_NAMES = ["qoder", "kimi", "pi", "grok"] as const;

export type HarnessName = (typeof HARNESS_NAMES)[number];

export const HARNESS_BINARIES: Record<HarnessName, string> = {
  qoder: "qodercli",
  kimi: "kimi",
  pi: "pi",
  grok: "grok",
};

export interface BuildCommandInput {
  name: HarnessName;
  briefPath: string;
  promptText: string;
  worktreePath: string;
  runDir: string;
  runId: string;
  executable: string;
  model?: string;
  maxTurns?: number;
}

export interface BuiltCommand {
  argv: string[];
  cwd: string;
  env: Record<string, string>;
  notes: string[];
}

export interface HarnessStatus {
  name: HarnessName;
  binary: string;
  installed: boolean;
  path: string | null;
  version: string | null;
}

export interface Evidence {
  run_id: string;
  harness: HarnessName;
  worktree: string;
  branch: string;
  base_sha: string;
  head_sha: string;
  exit_code: number;
  timed_out: boolean;
  summary: string;
  diff_stat: string;
  diff_path: string;
  log_path: string;
  started_at: string;
  finished_at: string;
  argv: string[];
  notes: string[];
}

export function isHarnessName(value: string): value is HarnessName {
  return (HARNESS_NAMES as readonly string[]).includes(value);
}
