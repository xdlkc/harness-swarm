import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runHarness } from "../src/dispatch.js";

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")}: ${result.stderr || result.stdout}`);
  }
  return (result.stdout || "").trim();
}

describe("runHarness worktree dispatch", () => {
  it("creates a worktree, runs stub, records evidence, does not merge the source checkout", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "harness-swarm-"));
    git(root, ["init"]);
    git(root, ["config", "user.email", "test@example.com"]);
    git(root, ["config", "user.name", "Test"]);
    writeFileSync(path.join(root, "README.md"), "hello\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-m", "init"]);
    const originalSha = git(root, ["rev-parse", "HEAD"]);
    const originalBranch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);

    const stubDir = path.join(root, "bin");
    mkdirSync(stubDir);
    const stub = path.join(stubDir, "stub-harness");
    writeFileSync(
      stub,
      `#!/usr/bin/env node
const fs = require("fs");
fs.writeFileSync("stub-ran.txt", "from stub\\n");
console.log("stub summary: ok");
`,
    );
    chmodSync(stub, 0o755);

    const evidence = await runHarness({
      name: "qoder",
      prompt: "touch a file via stub",
      repoRoot: root,
      executable: stub,
      timeoutMs: 15_000,
      maxTurns: 40,
    });

    assert.equal(evidence.harness, "qoder");
    assert.equal(evidence.exit_code, 0);
    assert.equal(evidence.timed_out, false);
    assert.match(evidence.summary, /stub summary/);
    assert.ok(evidence.worktree.includes(".harness-swarm/worktrees/"));
    assert.match(evidence.branch, /^harness\/qoder\//);
    assert.equal(evidence.base_sha, originalSha);
    assert.ok(evidence.diff_stat.length >= 0);
    assert.ok(evidence.diff_path.endsWith("diff.patch"));
    const diff = readFileSync(evidence.diff_path, "utf8");
    assert.match(diff, /stub-ran\.txt/);
    assert.ok(evidence.argv.includes("-w"));
    assert.ok(evidence.argv.includes("--yolo"));

    const afterSha = git(root, ["rev-parse", "HEAD"]);
    const afterBranch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
    assert.equal(afterSha, originalSha);
    assert.equal(afterBranch, originalBranch);
    const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", originalSha, "HEAD"], {
      cwd: root,
    });
    assert.equal(ancestor.status, 0);
    const range = git(root, ["log", "--oneline", `${originalSha}..HEAD`]);
    assert.equal(range, "");
    const merged = spawnSync("git", ["log", "-1", "--merges"], { cwd: root, encoding: "utf8" });
    assert.equal((merged.stdout || "").trim(), "");
  });
});
