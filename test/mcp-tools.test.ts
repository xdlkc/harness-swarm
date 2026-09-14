import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { callMcpTool, RUN_HARNESS_SCHEMA } from "../src/mcp-tools.js";

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")}: ${result.stderr || result.stdout}`);
  }
  return (result.stdout || "").trim();
}

function initRepo(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "workspace-repo-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  writeFileSync(path.join(root, "README.md"), "hello\n");
  git(root, ["add", "README.md"]);
  git(root, ["commit", "-m", "init"]);
  return root;
}

function writeStub(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const stub = path.join(dir, "stub-harness");
  writeFileSync(
    stub,
    `#!/usr/bin/env node
const fs = require("fs");
fs.writeFileSync("stub-ran.txt", "from stub\\n");
console.log("stub summary: ok");
`,
  );
  chmodSync(stub, 0o755);
  return stub;
}

describe("callMcpTool run_harness", () => {
  for (const name of ["codex", "claude", "dsh", "opencode"] as const) {
    it(`${name}: dispatches through MCP and captures changes without merging`, async (t) => {
      const workspace = initRepo();
      t.after(() => rmSync(workspace, { recursive: true, force: true }));
      const originalSha = git(workspace, ["rev-parse", "HEAD"]);
      const originalBranch = git(workspace, ["branch", "--show-current"]);
      const stub = writeStub(path.join(workspace, "bin"));
      writeFileSync(stub, `#!/usr/bin/env node
const fs = require("node:fs");
fs.writeFileSync("stub-ran.txt", "from ${name}\\n");
console.log(JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd() }));
`);
      const prompt = '--help\nKeep "quotes" and $HOME literal.';
      const result = await callMcpTool("run_harness", {
        name, prompt, repo_root: workspace, ...(name === "dsh" ? {} : { model: "provider/model" }),
        ...(name === "claude" ? { max_turns: 3 } : {}), timeout_ms: 15000,
      }, { executable: stub });
      if (!result.ok || result.name !== "run_harness") {
        assert.fail(`expected ${name} dispatch: ${JSON.stringify(result)}`);
      }
      const evidence = result.data;
      assert.equal(evidence.harness, name);
      assert.equal(evidence.exit_code, 0);
      assert.equal(evidence.timed_out, false);
      const recorded = JSON.parse(evidence.summary);
      assert.deepEqual(recorded.argv, evidence.argv.slice(1));
      assert.equal(recorded.argv.at(-1), prompt);
      assert.equal(git(recorded.cwd, ["rev-parse", "--show-toplevel"]), git(evidence.worktree, ["rev-parse", "--show-toplevel"]));
      assert.match(readFileSync(evidence.diff_path, "utf8"), /stub-ran\.txt/);
      assert.match(readFileSync(evidence.log_path, "utf8"), /stdout/);
      assert.deepEqual(JSON.parse(readFileSync(path.join(path.dirname(evidence.log_path), "evidence.json"), "utf8")), evidence);
      assert.equal(git(workspace, ["rev-parse", "HEAD"]), originalSha);
      assert.equal(git(workspace, ["branch", "--show-current"]), originalBranch);
      assert.equal(existsSync(path.join(workspace, "stub-ran.txt")), false);
    });
  }

  it("advertises all eight harnesses in the shipped schema", () => {
    assert.deepEqual(RUN_HARNESS_SCHEMA.properties.name.enum, [
      "qoder", "kimi", "pi", "grok", "codex", "claude", "dsh", "opencode",
    ]);
  });

  it("requires repo_root in the shipped schema", () => {
    assert.ok(RUN_HARNESS_SCHEMA.required.includes("repo_root"));
    assert.ok(RUN_HARNESS_SCHEMA.properties.repo_root);
  });

  it("rejects missing or relative repo_root even when cwd is a git repo and CODEX_WORKSPACE_ROOT is unset", async () => {
    const pluginCwd = initRepo();
    const previous = process.cwd();
    const had = process.env.CODEX_WORKSPACE_ROOT;
    delete process.env.CODEX_WORKSPACE_ROOT;
    process.chdir(pluginCwd);
    try {
      const missing = await callMcpTool("run_harness", {
        name: "qoder",
        prompt: "x",
      });
      assert.equal(missing.ok, false);
      if (!missing.ok) {
        assert.match(missing.message, /repo_root/);
      }
      const relative = await callMcpTool("run_harness", {
        name: "qoder",
        prompt: "x",
        repo_root: ".",
      });
      assert.equal(relative.ok, false);
      if (!relative.ok) {
        assert.match(relative.message, /absolute/);
      }
    } finally {
      process.chdir(previous);
      if (had === undefined) {
        delete process.env.CODEX_WORKSPACE_ROOT;
      } else {
        process.env.CODEX_WORKSPACE_ROOT = had;
      }
    }
  });

  it("creates the worktree under repo_root when MCP cwd is a plugin-like dir and CODEX_WORKSPACE_ROOT is unset", async () => {
    const workspace = initRepo();
    const pluginCwd = mkdtempSync(path.join(os.tmpdir(), "plugin-cache-"));
    const stub = writeStub(path.join(workspace, "bin"));
    const previous = process.cwd();
    const had = process.env.CODEX_WORKSPACE_ROOT;
    delete process.env.CODEX_WORKSPACE_ROOT;
    process.chdir(pluginCwd);
    try {
      const result = await callMcpTool(
        "run_harness",
        {
          name: "qoder",
          prompt: "touch a file via stub",
          repo_root: workspace,
        },
        { executable: stub, extraEnv: { CODEX_WORKSPACE_ROOT: "" } },
      );
      assert.equal(result.ok, true);
      if (!result.ok || result.name !== "run_harness") {
        throw new Error("expected run_harness success");
      }
      assert.ok(
        result.data.worktree.startsWith(path.join(workspace, ".harness-swarm")),
        `worktree ${result.data.worktree} not under workspace`,
      );
      assert.equal(result.data.worktree.startsWith(pluginCwd), false);
      assert.equal(result.data.exit_code, 0);
    } finally {
      process.chdir(previous);
      if (had === undefined) {
        delete process.env.CODEX_WORKSPACE_ROOT;
      } else {
        process.env.CODEX_WORKSPACE_ROOT = had;
      }
    }
  });
});
