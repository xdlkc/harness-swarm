import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { it } from "node:test";
import { runHarness } from "../src/dispatch.js";
import { redactArgv } from "../src/evidence.js";

function repo(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "swarm-options-"));
  for (const args of [["init"], ["config", "user.email", "test@example.com"], ["config", "user.name", "Test"]]) {
    assert.equal(spawnSync("git", args, { cwd: root }).status, 0);
  }
  writeFileSync(path.join(root, "README.md"), "fixture\n");
  assert.equal(spawnSync("git", ["add", "."], { cwd: root }).status, 0);
  assert.equal(spawnSync("git", ["commit", "-m", "init"], { cwd: root }).status, 0);
  return root;
}

it("invalid capabilities and malformed native arguments fail before allocating artifacts", async (t) => {
  const root = repo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  await assert.rejects(runHarness({ name: "dsh", prompt: "task", model: "unsupported", repoRoot: root }), /does not support model/);
  await assert.rejects(runHarness({ name: "codex", prompt: "task", nativeArgs: ["--strict-config", "review"], repoRoot: root }), /positional/);
  await assert.rejects(runHarness({ name: "pi", prompt: "task", timeoutMs: 2 ** 32, repoRoot: root }), /maximum timer/);
  await assert.rejects(runHarness({ name: "codex", prompt: "x".repeat(4001), goal: true, repoRoot: root }), /4000/);
  assert.equal(existsSync(path.join(root, ".harness-swarm")), false);
});

for (const status of ["complete", "blocked", "missing"] as const) {
  it(`Kimi goal evidence requires a native verdict: ${status}`, async (t) => {
    const root = repo();
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const stub = path.join(root, "stub");
    writeFileSync(stub, `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync('result.txt','ok');
console.log(JSON.stringify({type:'args', argv:process.argv.slice(2)}));
${status === "missing" ? "" : `console.log(JSON.stringify({type:'goal.summary',status:'${status}'}));`}
`);
    chmodSync(stub, 0o755);
    const result = await runHarness({ name: "kimi", prompt: "write a result", goal: true, repoRoot: root, executable: stub });
    assert.equal(result.exit_code, status === "complete" ? 0 : 1);
    assert.equal(result.goal_status, status === "missing" ? undefined : status);
    assert.match(result.summary, /\/goal write a result/);
    assert.equal(readFileSync(path.join(path.dirname(result.log_path), "brief.md"), "utf8"), "/goal write a result");
    assert.match(readFileSync(result.diff_path, "utf8"), /result.txt/);
  });
}

it("Grok receives goal budget in the brief and uses streaming output for observability", async (t) => {
  const root = repo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const stub = path.join(root, "stub");
  writeFileSync(stub, '#!/usr/bin/env node\nconsole.log("ok");\n');
  chmodSync(stub, 0o755);
  const result = await runHarness({ name: "grok", prompt: "write a result", goal: true, tokenBudget: 5000, repoRoot: root, executable: stub });
  assert.equal(readFileSync(path.join(path.dirname(result.log_path), "brief.md"), "utf8"), "/goal write a result --budget 5000");
  assert.ok(result.argv.includes("streaming-json"));
  assert.ok(!result.argv.includes("--no-subagents"));
  assert.equal(result.goal_status, undefined);
});

it("timeout returns failure evidence and stops a process that ignores SIGTERM", async (t) => {
  const root = repo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const stub = path.join(root, "stub");
  writeFileSync(stub, '#!/bin/sh\ntrap "" TERM\necho started\nwhile :; do sleep 1; done\n');
  chmodSync(stub, 0o755);
  const result = await runHarness({ name: "pi", prompt: "task", repoRoot: root, executable: stub, timeoutMs: 1500 });
  assert.equal(result.timed_out, true);
  assert.equal(result.exit_code, 124);
  assert.match(readFileSync(result.log_path, "utf8"), /started/);
});

it("native credentials are redacted from argv, including nested config payloads", () => {
  const secret = "sk-test-review";
  for (const args of [
    ["pi", "--api-key", secret],
    ["codex", "-c", `model_providers.custom.http_headers={Authorization="Bearer ${secret}"}`],
    ["claude", "--settings", JSON.stringify({ env: { ANTHROPIC_API_KEY: secret } })],
    ["claude", `--mcp-config={"headers":{"Authorization":"Bearer ${secret}"}}`],
  ]) {
    assert.ok(!redactArgv(args).join(" ").includes(secret));
    assert.ok(args.join(" ").includes(secret), "execution argv is not mutated");
  }
  assert.deepEqual(redactArgv(["--task-budget", "4000", "--max-output-tokens=16000"]), ["--task-budget", "4000", "--max-output-tokens=16000"]);
});
