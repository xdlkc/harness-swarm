import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runHarness, runSession } from "../src/dispatch.js";

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr || result.stdout}`);
  return (result.stdout || "").trim();
}

function initRepo(t: { after(fn: () => void): void }): { root: string; originalSha: string; originalBranch: string } {
  const root = mkdtempSync(path.join(os.tmpdir(), "harness-session-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, ["init"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  writeFileSync(path.join(root, "README.md"), "hello\n");
  git(root, ["add", "README.md"]);
  git(root, ["commit", "-m", "init"]);
  return { root, originalSha: git(root, ["rev-parse", "HEAD"]), originalBranch: git(root, ["rev-parse", "--abbrev-ref", "HEAD"]) };
}

function makeStub(t: { after(fn: () => void): void }): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "harness-session-stub-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const stub = path.join(dir, "stub");
  writeFileSync(stub, `#!/usr/bin/env node\nconst fs = require("fs");\nfs.writeFileSync("stub-ran.txt", "ok\\n");\nconsole.log("session stub ok");\n`);
  chmodSync(stub, 0o755);
  return stub;
}

describe("runSession worktree dispatch", () => {
  it("resumes a session into a fresh worktree and records session evidence without merging", async (t) => {
    const { root, originalSha, originalBranch } = initRepo(t);
    const stub = makeStub(t);

    const evidence = await runSession({
      name: "qoder",
      action: "resume",
      sessionId: "sess-123",
      prompt: "continue the work",
      repoRoot: root,
      executable: stub,
      timeoutMs: 15_000,
    });

    assert.equal(evidence.harness, "qoder");
    assert.equal(evidence.exit_code, 0);
    assert.equal(evidence.timed_out, false);
    assert.deepEqual(evidence.session, { action: "resume", id: "sess-123" });
    assert.match(evidence.summary, /session stub ok/);
    assert.ok(evidence.worktree.includes(".harness-swarm/worktrees/"));
    assert.match(evidence.branch, /^harness\/qoder\//);
    assert.equal(evidence.base_sha, originalSha);
    assert.ok(evidence.argv.includes("-r"));
    assert.ok(evidence.argv.includes("sess-123"));
    const diff = readFileSync(evidence.diff_path, "utf8");
    assert.match(diff, /stub-ran\.txt/);

    assert.equal(git(root, ["rev-parse", "HEAD"]), originalSha);
    assert.equal(git(root, ["branch", "--show-current"]), originalBranch);
    assert.equal(existsSync(path.join(root, "stub-ran.txt")), false);
  });

  it("forks an opencode2 session with --fork in the argv", async (t) => {
    const { root } = initRepo(t);
    const stub = makeStub(t);
    const evidence = await runSession({
      name: "opencode2", action: "fork", sessionId: "ses_1", prompt: "fork and continue",
      repoRoot: root, executable: stub, timeoutMs: 15_000,
    });
    assert.equal(evidence.exit_code, 0);
    assert.deepEqual(evidence.session, { action: "fork", id: "ses_1" });
    assert.ok(evidence.argv.includes("--fork"));
    assert.ok(evidence.argv.includes("--session"));
  });

  it("rejects fork on a harness without fork support before allocating a worktree", async (t) => {
    const { root } = initRepo(t);
    const stub = makeStub(t);
    await assert.rejects(
      runSession({ name: "qoder", action: "fork", sessionId: "sess-1", prompt: "x", repoRoot: root, executable: stub }),
      /does not support session fork/,
    );
    assert.equal(existsSync(path.join(root, ".harness-swarm")), false);
  });

  it("rejects resume on a harness without session history", async (t) => {
    const { root } = initRepo(t);
    const stub = makeStub(t);
    await assert.rejects(
      runSession({ name: "dsh", action: "resume", sessionId: "sess-1", prompt: "x", repoRoot: root, executable: stub }),
      /does not support session resume/,
    );
  });

  it("records a seeded native_session_id for a fresh grok run", async (t) => {
    const { root } = initRepo(t);
    const stub = makeStub(t);
    const evidence = await runHarness({ name: "grok", prompt: "task", repoRoot: root, executable: stub, timeoutMs: 15_000 });
    assert.match(evidence.native_session_id!, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(evidence.argv.includes("--session-id"));
    assert.ok(evidence.argv.includes(evidence.native_session_id!));
  });

  it("resume records native_session_id as the resumed session id", async (t) => {
    const { root } = initRepo(t);
    const stub = makeStub(t);
    const evidence = await runSession({ name: "codex", action: "resume", sessionId: "sess-x", prompt: "continue", repoRoot: root, executable: stub });
    assert.equal(evidence.native_session_id, "sess-x");
  });
});
