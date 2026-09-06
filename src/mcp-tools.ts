import path from "node:path";
import { isHarnessName } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness, type RunHarnessOptions } from "./dispatch.js";
import type { Evidence, HarnessStatus } from "./types.js";

export const RUN_HARNESS_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", enum: ["qoder", "kimi", "pi", "grok"] },
    prompt: { type: "string" },
    repo_root: {
      type: "string",
      description:
        "Absolute path of the git repository Codex has open. Required: plugin MCP cwd is the plugin root, not the user workspace.",
    },
    model: { type: "string" },
    max_turns: { type: "number" },
    timeout_ms: { type: "number" },
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

/**
 * Shipped MCP tools/call handler. Codex plugin stdio does not inject
 * CODEX_WORKSPACE_ROOT; run_harness must receive an absolute repo_root.
 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {},
  overrides: CallMcpToolOverrides = {},
): Promise<CallMcpToolResult> {
  if (name === "list_harnesses") {
    return { ok: true, name: "list_harnesses", data: listHarnesses() };
  }
  if (name === "run_harness") {
    const harness = String(args.name ?? "");
    const prompt = String(args.prompt ?? "");
    const repoRoot = String(args.repo_root ?? "");
    if (!isHarnessName(harness)) {
      return { ok: false, code: -32602, message: "name must be qoder|kimi|pi|grok" };
    }
    if (!prompt) {
      return { ok: false, code: -32602, message: "prompt is required" };
    }
    if (!repoRoot) {
      return { ok: false, code: -32602, message: "repo_root is required (absolute path of the open workspace)" };
    }
    if (!path.isAbsolute(repoRoot)) {
      return { ok: false, code: -32602, message: "repo_root must be an absolute path" };
    }
    const options: RunHarnessOptions = {
      name: harness,
      prompt,
      repoRoot,
      model: args.model ? String(args.model) : undefined,
      maxTurns: typeof args.max_turns === "number" ? args.max_turns : undefined,
      timeoutMs: typeof args.timeout_ms === "number" ? args.timeout_ms : undefined,
      executable: overrides.executable,
      extraEnv: overrides.extraEnv,
    };
    const evidence = await runHarness(options);
    return { ok: true, name: "run_harness", data: evidence };
  }
  return { ok: false, code: -32601, message: `unknown tool ${name}` };
}
