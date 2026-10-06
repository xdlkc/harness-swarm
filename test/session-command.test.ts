import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSessionCommand } from "../src/session-command.js";
import type { SessionBuildInput } from "../src/session-command.js";

function base(overrides: Partial<SessionBuildInput> & Pick<SessionBuildInput, "name" | "action">): SessionBuildInput {
  return {
    sessionId: "sess-1",
    promptText: "continue the work",
    worktreePath: "/repo/.harness-swarm/worktrees/r1",
    briefPath: "/repo/.harness-swarm/runs/r1/brief.md",
    runId: "r1",
    executable: "harness-bin",
    ...overrides,
  };
}

describe("buildSessionCommand", () => {
  it("qoder resume uses -r and refuses fork", () => {
    const built = buildSessionCommand(base({ name: "qoder", action: "resume" }));
    assert.deepEqual(built.argv, [
      "harness-bin", "-r", "sess-1", "-w", "/repo/.harness-swarm/worktrees/r1",
      "-p", "continue the work", "-f", "json", "--quiet", "--yolo",
    ]);
    assert.equal(built.cwd, "/repo/.harness-swarm/worktrees/r1");
    assert.throws(() => buildSessionCommand(base({ name: "qoder", action: "fork" })), /does not support session fork/);
  });

  it("kimi resume uses --session and refuses fork", () => {
    const built = buildSessionCommand(base({ name: "kimi", action: "resume", model: "m1" }));
    assert.deepEqual(built.argv, [
      "harness-bin", "--session", "sess-1", "-p", "continue the work", "--output-format", "stream-json", "-m", "m1",
    ]);
    assert.throws(() => buildSessionCommand(base({ name: "kimi", action: "fork" })), /does not support session fork/);
  });

  it("pi resume/fork use --session/--fork and keep the default session store", () => {
    const resume = buildSessionCommand(base({ name: "pi", action: "resume" }));
    assert.deepEqual(resume.argv, [
      "harness-bin", "--mode", "json", "-p", "--exclude-tools", "ask_question",
      "--session", "sess-1", "--name", "harness-r1",
      "@/repo/.harness-swarm/runs/r1/brief.md",
      "Execute the brief. Do not ask questions.",
      "--approve",
    ]);
    assert.ok(!resume.argv.includes("--session-dir"));
    const fork = buildSessionCommand(base({ name: "pi", action: "fork" }));
    assert.equal(fork.argv[fork.argv.indexOf("--fork") + 1], "sess-1");
    assert.ok(!fork.argv.includes("--session"));
  });

  it("grok resume/fork add --fork-session when forking", () => {
    const resume = buildSessionCommand(base({ name: "grok", action: "resume" }));
    assert.deepEqual(resume.argv, [
      "harness-bin", "--cwd", "/repo/.harness-swarm/worktrees/r1",
      "--prompt-file", "/repo/.harness-swarm/runs/r1/brief.md",
      "--output-format", "json", "--verbatim", "--resume", "sess-1",
      "--no-subagents", "--always-approve",
    ]);
    const fork = buildSessionCommand(base({ name: "grok", action: "fork" }));
    assert.ok(fork.argv.includes("--fork-session"));
    assert.equal(fork.argv[fork.argv.indexOf("--resume") + 1], "sess-1");
  });

  it("codex resume/fork dispatch the exec subcommand with the session id positional", () => {
    const resume = buildSessionCommand(base({ name: "codex", action: "resume" }));
    assert.deepEqual(resume.argv, [
      "harness-bin", "exec", "resume", "--json", "--cd", "/repo/.harness-swarm/worktrees/r1",
      "--dangerously-bypass-approvals-and-sandbox", "sess-1", "--", "continue the work",
    ]);
    const fork = buildSessionCommand(base({ name: "codex", action: "fork" }));
    assert.equal(fork.argv[2], "fork");
    assert.equal(fork.argv[fork.argv.length - 2], "--");
  });

  it("claude resume/fork use --resume and add --fork-session when forking", () => {
    const resume = buildSessionCommand(base({ name: "claude", action: "resume", model: "m1" }));
    assert.deepEqual(resume.argv, [
      "harness-bin", "-p", "--output-format", "json", "--dangerously-skip-permissions",
      "--resume", "sess-1", "--model", "m1", "--", "continue the work",
    ]);
    assert.ok(!resume.argv.includes("--no-session-persistence"));
    const fork = buildSessionCommand(base({ name: "claude", action: "fork" }));
    assert.ok(fork.argv.includes("--fork-session"));
  });

  it("opencode2 resume/fork use run --session and add --fork when forking", () => {
    const resume = buildSessionCommand(base({ name: "opencode2", action: "resume" }));
    assert.deepEqual(resume.argv, [
      "harness-bin", "run", "--format", "json", "--session", "sess-1", "--auto", "--", "continue the work",
    ]);
    const fork = buildSessionCommand(base({ name: "opencode2", action: "fork" }));
    assert.ok(fork.argv.includes("--fork"));
    assert.equal(fork.argv[fork.argv.indexOf("--session") + 1], "sess-1");
  });

  it("rejects unsupported harnesses", () => {
    for (const name of ["dsh", "opencode"] as const) {
      assert.throws(() => buildSessionCommand(base({ name, action: "resume" })), /does not support session resume/);
    }
  });
});
