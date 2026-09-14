import path from "node:path";
import { HARNESS_NAMES } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness, type RunHarnessOptions } from "./dispatch.js";
import { validateRunOptions } from "./options.js";
import type { Evidence, HarnessStatus } from "./types.js";

export const RUN_HARNESS_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", enum: HARNESS_NAMES },
    prompt: { type: "string", minLength: 1 },
    repo_root: {
      type: "string", minLength: 1,
      description:
        "Absolute path of the git repository Codex has open. Required: plugin MCP cwd is the plugin root, not the user workspace.",
    },
    model: { type: "string", minLength: 1 },
    max_turns: { type: "integer", minimum: 0, description: "0 is allowed only for qoder; other harnesses require a positive integer." },
    timeout_ms: { type: "integer", minimum: 1 },
    effort: { type: "string", minLength: 1 },
    goal: { type: "boolean" },
    token_budget: { type: "integer", minimum: 1 },
    max_budget_usd: { type: "number", exclusiveMinimum: 0 },
    persist_session: { type: "boolean" },
    native_args: { type: "array", items: { type: "string" }, description: "Native argv elements; wrapper-managed arguments cannot be overridden." },
  },
  required: ["name", "prompt", "repo_root"],
  additionalProperties: false,
} as const;

export type CallMcpToolResult =
  | { ok: true; name: "list_harnesses"; data: HarnessStatus[] }
  | { ok: true; name: "run_harness"; data: Evidence }
  | { ok: false; code: number; message: string };

export interface CallMcpToolOverrides {
  executable?: string;
  extraEnv?: Record<string, string>;
}

const MCP_FIELDS = {
  name: "name", prompt: "prompt", repo_root: "repoRoot", model: "model", max_turns: "maxTurns",
  timeout_ms: "timeoutMs", effort: "effort", goal: "goal", token_budget: "tokenBudget",
  max_budget_usd: "maxBudgetUsd", persist_session: "persistSession", native_args: "nativeArgs",
} as const;

/** Convert names, preserving original values so validation can reject incorrect JSON types. */
export function parseMcpRunOptions(args: Record<string, unknown>, overrides: CallMcpToolOverrides = {}): RunHarnessOptions {
  if (args === null || typeof args !== "object" || Array.isArray(args)) {
    throw new Error("arguments must be an object");
  }
  const values: Record<string, unknown> = { executable: overrides.executable, extraEnv: overrides.extraEnv };
  for (const [field, value] of Object.entries(args)) {
    if (!Object.hasOwn(MCP_FIELDS, field)) throw new Error(`unknown argument: ${field}`);
    values[MCP_FIELDS[field as keyof typeof MCP_FIELDS]] = value;
  }
  const options = values as unknown as RunHarnessOptions;
  validateRunOptions(options);
  if (options.repoRoot === undefined) {
    throw new Error("repo_root is required (absolute path of the open workspace)");
  }
  if (!path.isAbsolute(options.repoRoot)) throw new Error("repo_root must be an absolute path");
  return options;
}

/** Plugin cwd is not the user workspace: run_harness requires an absolute repo_root. */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {},
  overrides: CallMcpToolOverrides = {},
): Promise<CallMcpToolResult> {
  if (name === "list_harnesses") {
    if (args === null || typeof args !== "object" || Array.isArray(args) || Object.keys(args).length !== 0) {
      return { ok: false, code: -32602, message: "list_harnesses accepts an empty arguments object only" };
    }
    return { ok: true, name: "list_harnesses", data: listHarnesses() };
  }
  if (name === "run_harness") {
    let options: RunHarnessOptions;
    try {
      options = parseMcpRunOptions(args, overrides);
    } catch (error) {
      return { ok: false, code: -32602, message: error instanceof Error ? error.message : String(error) };
    }
    const evidence = await runHarness(options);
    return { ok: true, name: "run_harness", data: evidence };
  }
  return { ok: false, code: -32601, message: `unknown tool ${name}` };
}
