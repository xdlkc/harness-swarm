export const HARNESS_NAMES = ["qoder", "kimi", "pi", "grok", "codex", "claude", "dsh", "opencode", "opencode2"] as const;

export type HarnessName = (typeof HARNESS_NAMES)[number];

export const HARNESS_BINARIES: Record<HarnessName, string> = {
  qoder: "qodercli",
  kimi: "kimi",
  pi: "pi",
  grok: "grok",
  codex: "codex",
  claude: "claude",
  dsh: "dsh",
  opencode: "opencode",
  opencode2: "opencode2",
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
  effort?: string;
  goal?: boolean;
  tokenBudget?: number;
  maxBudgetUsd?: number;
  persistSession?: boolean;
  nativeArgs?: string[];
  /** Pre-assigned native session id, seeded via --session-id where the harness supports it. */
  sessionId?: string;
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
  capabilities?: HarnessCapabilities;
}

export interface HarnessCapabilities {
  model: boolean;
  effort: boolean;
  max_turns: boolean;
  goal: boolean;
  token_budget: "goal" | "task" | false;
  max_budget_usd: boolean;
  persist_session: boolean;
  native_args: boolean;
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
  goal_status?: string;
  /** Native session id the harness created/used, when it can be determined. */
  native_session_id?: string;
  session?: { action: "resume" | "fork"; id: string };
}

export function isHarnessName(value: string): value is HarnessName {
  return (HARNESS_NAMES as readonly string[]).includes(value);
}
