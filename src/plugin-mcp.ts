import { readFileSync } from "node:fs";
import path from "node:path";

export interface PluginMcpLaunch {
  command: string;
  args: string[];
  cwd: string;
}

interface McpJson {
  mcpServers?: Record<
    string,
    {
      command?: string;
      args?: string[];
      cwd?: string;
    }
  >;
}

/**
 * Load the shipped plugin MCP launch recipe.
 * Codex joins a relative `cwd` onto the installed plugin root; without `cwd`,
 * relative args are resolved from the session cwd and the server fails when
 * Codex is open on another repo.
 */
export function loadPluginMcpLaunch(pluginRoot: string): PluginMcpLaunch {
  const raw = JSON.parse(readFileSync(path.join(pluginRoot, "mcp.json"), "utf8")) as McpJson;
  const server = raw.mcpServers?.["harness-swarm"];
  if (!server?.command) {
    throw new Error("mcp.json missing harness-swarm.command");
  }
  if (!server.cwd) {
    throw new Error("mcp.json must set cwd so Codex starts the server from the plugin root");
  }
  if (path.isAbsolute(server.cwd) && !server.cwd.startsWith(pluginRoot)) {
    throw new Error("mcp.json cwd must stay under the plugin root");
  }
  return {
    command: server.command,
    args: server.args ?? [],
    cwd: server.cwd,
  };
}

/** Mirror Codex: relative cwd is joined onto plugin_root. */
export function resolvePluginMcpCwd(pluginRoot: string, configuredCwd: string): string {
  if (path.isAbsolute(configuredCwd)) {
    return path.normalize(configuredCwd);
  }
  return path.resolve(pluginRoot, configuredCwd);
}

export function resolvePluginMcpScript(pluginRoot: string, launch: PluginMcpLaunch): string {
  const cwd = resolvePluginMcpCwd(pluginRoot, launch.cwd);
  const script = launch.args[0];
  if (!script) {
    throw new Error("mcp.json args must include the wrapper script");
  }
  return path.isAbsolute(script) ? script : path.resolve(cwd, script);
}
