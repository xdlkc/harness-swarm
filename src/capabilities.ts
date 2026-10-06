import type { BuildCommandInput, HarnessCapabilities, HarnessName } from "./types.js";
import { validateNativeArgStructure } from "./native-args.js";

const capability = (overrides: Partial<HarnessCapabilities>): HarnessCapabilities => ({
  model: true, effort: false, max_turns: false, goal: false,
  token_budget: false, max_budget_usd: false, persist_session: false, native_args: true,
  ...overrides,
});

export const HARNESS_CAPABILITIES: Record<HarnessName, HarnessCapabilities> = {
  qoder: capability({ max_turns: true }),
  kimi: capability({ goal: true }),
  pi: capability({ effort: true, persist_session: true }),
  grok: capability({ effort: true, max_turns: true, goal: true, token_budget: "goal" }),
  codex: capability({ effort: true, goal: true, token_budget: "goal", persist_session: true }),
  claude: capability({ effort: true, max_turns: true, goal: true, token_budget: "task", max_budget_usd: true, persist_session: true }),
  dsh: capability({ model: false }),
  opencode: capability({ effort: true }),
  opencode2: capability({}),
};

// These flags select the execution transport, prompt, or worktree owned by the runner.
const RESERVED: Record<HarnessName, string[]> = {
  qoder: ["--workspace", "-w", "--worktree", "--branch", "-p", "--print", "-f", "--output-format", "--input-format"],
  kimi: ["-p", "--prompt", "--output-format", "--yolo", "-y", "--yes", "--auto", "--auto-approve", "--plan"],
  pi: ["--mode", "-p", "--print", "--session-dir", "--session-id", "--no-session", "--export", "--list-models"],
  grok: ["--cwd", "-w", "--worktree", "--worktree-ref", "--ref", "--restore-code", "-p", "--single", "--print", "--prompt-file", "--prompt-json", "--output-format", "--verbatim", "--session-id", "-s"],
  codex: ["--cd", "-C", "--worktree", "--json", "--ephemeral", "--output-last-message", "-o"],
  claude: ["-p", "--print", "--input-format", "--output-format", "-w", "--worktree", "--no-session-persistence", "--remote-control", "--rc", "--cloud", "--remote", "--session-id"],
  dsh: ["--profile", "--dump-config", "--dump-default-config"],
  opencode: ["--dir", "--attach", "--format", "--interactive", "-i", "--mini", "--share"],
  opencode2: ["--format", "--session", "-s", "--continue", "-c", "--fork", "--standalone", "--server"],
};

export function hasNative(args: string[], flags: string[]): boolean {
  return args.some((arg) => flags.some((flag) => arg === flag || arg.startsWith(`${flag}=`)
    || (flag.length === 2 && arg.startsWith(flag) && arg.length > 2)));
}

export function validateCapabilities(input: Pick<BuildCommandInput,
  "name" | "model" | "effort" | "maxTurns" | "goal" | "tokenBudget" | "maxBudgetUsd" | "persistSession" | "nativeArgs">): void {
  const c = HARNESS_CAPABILITIES[input.name];
  for (const [value, supported, label] of [
    [input.model, c.model, "model"], [input.effort, c.effort, "effort"],
    [input.maxTurns, c.max_turns, "max_turns"], [input.goal || undefined, c.goal, "goal"],
    [input.tokenBudget, c.token_budget, "token_budget"], [input.maxBudgetUsd, c.max_budget_usd, "max_budget_usd"],
    [input.persistSession, c.persist_session, "persist_session"],
  ] as const) {
    if (value !== undefined && !supported) throw new Error(`${input.name} does not support ${label}; see docs/${input.name}/README.md`);
  }
  if (input.maxTurns === 0 && input.name !== "qoder") throw new Error(`${input.name} max_turns must be positive`);
  if (input.tokenBudget !== undefined && c.token_budget === "goal" && !input.goal) throw new Error("token_budget requires goal=true for this harness");
  if (input.name === "codex" && input.goal && input.persistSession === false) throw new Error("Codex goal requires a persistent thread; persist_session cannot be false");
  const args = input.nativeArgs ?? [];
  validateNativeArgStructure(input.name, args);
  if (args.length && !args[0].startsWith("-")) throw new Error("native_args contains options for the task entrypoint, not subcommands");
  if (args.includes("--") || args.some((arg) => arg.includes("\0"))) throw new Error("native_args cannot contain a separator or NUL");
  const blocked = [...RESERVED[input.name], "--help", "-h", "--version", ...(input.name === "codex" || input.name === "kimi" || input.name === "dsh" ? ["-V"] : ["-v"])];
  if (hasNative(args, blocked)) throw new Error(`${input.name} native_args conflicts with runner-owned prompt, workspace, or execution flags`);
  const common: [unknown, string[]][] = [
    [input.model, ["--model", ...(input.name === "qoder" || input.name === "pi" ? [] : ["-m"])]],
    [input.maxTurns, ["--max-turns"]], [input.maxBudgetUsd, ["--max-budget-usd"]],
    [input.tokenBudget, ["--task-budget"]], [input.effort, ["--effort", "--reasoning-effort", "--thinking", "--variant"]],
  ];
  for (const [value, flags] of common) {
    if (value !== undefined && hasNative(args, flags)) throw new Error(`native_args duplicates a structured option: ${flags[0]}`);
  }
  if ((input.name === "claude" || input.name === "codex") && !input.persistSession && !input.goal && hasNative(args, ["--resume", "--continue", ...(input.name === "claude" ? ["-r", "-c"] : [])])) {
    throw new Error("Session continuation requires persist_session=true");
  }
}
