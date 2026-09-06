#!/usr/bin/env node
/**
 * Minimal MCP stdio server. Tools call the same shipped list/dispatch functions as the CLI.
 */
import { isHarnessName } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness } from "./dispatch.js";

interface RpcRequest {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
}

function writeJsonLine(msg: unknown): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

// Codex MCP stdio commonly uses either Content-Length framing or newline JSON.
// Emit newline-delimited JSON-RPC, which Codex CLI accepts for stdio servers.
function reply(id: number | string | undefined, result: unknown): void {
  writeJsonLine({ jsonrpc: "2.0", id: id ?? null, result });
}

function fail(id: number | string | undefined, code: number, message: string): void {
  writeJsonLine({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

const TOOLS = [
  {
    name: "list_harnesses",
    description: "Report qoder, kimi, pi, and grok install path and version if present on PATH.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "run_harness",
    description:
      "Create a git worktree, run one named harness headlessly, return evidence. Does not merge.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", enum: ["qoder", "kimi", "pi", "grok"] },
        prompt: { type: "string" },
        model: { type: "string" },
        max_turns: { type: "number" },
        timeout_ms: { type: "number" },
      },
      required: ["name", "prompt"],
      additionalProperties: false,
    },
  },
];

async function handle(req: RpcRequest): Promise<void> {
  const { id, method, params } = req;
  if (!method) {
    return;
  }
  if (method === "initialize") {
    reply(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "harness-swarm", version: "0.1.0" },
    });
    return;
  }
  if (method === "notifications/initialized" || method === "initialized") {
    return;
  }
  if (method === "ping") {
    reply(id, {});
    return;
  }
  if (method === "tools/list") {
    reply(id, { tools: TOOLS });
    return;
  }
  if (method === "tools/call") {
    const name = String(params?.name ?? "");
    const args = (params?.arguments as Record<string, unknown> | undefined) ?? {};
    try {
      if (name === "list_harnesses") {
        const data = listHarnesses();
        reply(id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
        return;
      }
      if (name === "run_harness") {
        const harness = String(args.name ?? "");
        const prompt = String(args.prompt ?? "");
        if (!isHarnessName(harness)) {
          fail(id, -32602, "name must be qoder|kimi|pi|grok");
          return;
        }
        if (!prompt) {
          fail(id, -32602, "prompt is required");
          return;
        }
        const evidence = await runHarness({
          name: harness,
          prompt,
          model: args.model ? String(args.model) : undefined,
          maxTurns: typeof args.max_turns === "number" ? args.max_turns : undefined,
          timeoutMs: typeof args.timeout_ms === "number" ? args.timeout_ms : undefined,
        });
        reply(id, { content: [{ type: "text", text: JSON.stringify(evidence, null, 2) }] });
        return;
      }
      fail(id, -32601, `unknown tool ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      fail(id, -32000, message);
    }
    return;
  }
  if (id !== undefined) {
    fail(id, -32601, `unknown method ${method}`);
  }
}

let buffer = "";
let draining = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  void drain();
});

async function drain(): Promise<void> {
  if (draining) {
    return;
  }
  draining = true;
  try {
    while (true) {
      const nl = buffer.indexOf("\n");
      if (nl === -1) {
        break;
      }
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) {
        continue;
      }
      let req: RpcRequest;
      try {
        req = JSON.parse(line) as RpcRequest;
      } catch {
        continue;
      }
      await handle(req);
    }
  } finally {
    draining = false;
    if (buffer.includes("\n")) {
      void drain();
    }
  }
}


