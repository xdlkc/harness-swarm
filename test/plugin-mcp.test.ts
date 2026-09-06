import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { loadPluginMcpLaunch, resolvePluginMcpCwd, resolvePluginMcpScript } from "../src/plugin-mcp.js";
import { resolveTargetRepoRoot } from "../src/dispatch.js";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("plugin MCP launch cwd", () => {
  it("ships cwd . so Codex joins it onto plugin_root, not session cwd", () => {
    const launch = loadPluginMcpLaunch(pluginRoot);
    assert.equal(launch.command, "bash");
    assert.equal(launch.cwd, ".");
    assert.ok(!path.isAbsolute(launch.cwd));
    assert.equal(launch.args[0], "./bin/harness-swarm-mcp");
    assert.ok(!path.isAbsolute(launch.args[0]));

    const resolvedCwd = resolvePluginMcpCwd(pluginRoot, launch.cwd);
    assert.equal(resolvedCwd, pluginRoot);
    const script = resolvePluginMcpScript(pluginRoot, launch);
    assert.equal(script, path.join(pluginRoot, "bin/harness-swarm-mcp"));
    assert.ok(existsSync(script), `wrapper missing at ${script}`);

    const sessionCwd = mkdtempSync(path.join(os.tmpdir(), "codex-session-"));
    const broken = path.resolve(sessionCwd, launch.args[0]);
    assert.equal(existsSync(broken), false);
  });
});

describe("resolveTargetRepoRoot", () => {
  it("prefers CODEX_WORKSPACE_ROOT over process cwd so plugin-root MCP cwd does not steal the target repo", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "codex-workspace-"));
    const pluginCwd = mkdtempSync(path.join(os.tmpdir(), "plugin-cwd-"));
    const resolved = resolveTargetRepoRoot({
      cwd: pluginCwd,
      env: { CODEX_WORKSPACE_ROOT: workspace },
    });
    assert.equal(resolved, workspace);
  });
});
