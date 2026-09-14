#!/usr/bin/env node
/**
 * Minimal MCP stdio server. Tools call the same shipped list/dispatch functions as the CLI.
 */
import { callMcpTool, RUN_HARNESS_SCHEMA } from "./mcp-tools.js";

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
    description: "Report supported harnesses and their install path and version if present on PATH.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "run_harness",
    description:
      "Create a git worktree in repo_root, run one named harness headlessly, return evidence. Does not merge. repo_root must be the absolute path of the git repo Codex has open (plugin MCP cwd is the plugin, not the workspace).",
    inputSchema: RUN_HARNESS_SCHEMA,
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
      const result = await callMcpTool(name, args);
      if (!result.ok) {
        fail(id, result.code, result.message);
        return;
      }
      reply(id, { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] });
      return;
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

