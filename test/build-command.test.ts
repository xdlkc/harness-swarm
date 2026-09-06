import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { buildCommand } from "../src/build-command.js";
import type { BuildCommandInput } from "../src/types.js";

function base(overrides: Partial<BuildCommandInput> & Pick<BuildCommandInput, "name" | "executable">): BuildCommandInput {
  return {
    briefPath: "/repo/.harness-swarm/runs/r1/brief.md",
    promptText: "do the thing",
    worktreePath: "/repo/.harness-swarm/worktrees/r1",
    runDir: "/repo/.harness-swarm/runs/r1",
    runId: "r1",
    maxTurns: 40,
    ...overrides,
  };
}

describe("buildCommand", () => {
  it("qoder: -w, -f json, --yolo, --max-turns; not --worktree", () => {
    const built = buildCommand(base({ name: "qoder", executable: "qodercli" }));
    const argv = built.argv;
    assert.equal(argv[0], "qodercli");
    assert.ok(argv.includes("-w"));
    assert.equal(argv[argv.indexOf("-w") + 1], "/repo/.harness-swarm/worktrees/r1");
    assert.ok(argv.includes("-p"));
    assert.equal(argv[argv.indexOf("-p") + 1], "do the thing");
    assert.ok(argv.includes("-f"));
    assert.equal(argv[argv.indexOf("-f") + 1], "json");
    assert.ok(argv.includes("--yolo"));
    assert.ok(argv.includes("--max-turns"));
    assert.equal(argv[argv.indexOf("--max-turns") + 1], "40");
    assert.ok(!argv.includes("--worktree"));
    assert.equal(built.cwd, "/repo/.harness-swarm/worktrees/r1");
  });

  it("kimi: -p plus stream-json; forbids --yolo/--auto/--plan", () => {
    const built = buildCommand(base({ name: "kimi", executable: "kimi" }));
    const argv = built.argv;
    assert.equal(argv[0], "kimi");
    assert.ok(argv.includes("-p"));
    assert.equal(argv[argv.indexOf("-p") + 1], "do the thing");
    assert.ok(argv.includes("--output-format"));
    assert.equal(argv[argv.indexOf("--output-format") + 1], "stream-json");
    assert.ok(!argv.includes("--yolo"));
    assert.ok(!argv.includes("--auto"));
    assert.ok(!argv.includes("--plan"));
    assert.equal(built.cwd, "/repo/.harness-swarm/worktrees/r1");
    assert.equal(
      built.env.KIMI_CODE_HOME,
      path.join("/repo/.harness-swarm/runs/r1", "kimi-home"),
    );
  });

  it("pi: --mode json, @brief, --approve", () => {
    const built = buildCommand(base({ name: "pi", executable: "pi" }));
    const argv = built.argv;
    assert.equal(argv[0], "pi");
    assert.ok(argv.includes("--mode"));
    assert.equal(argv[argv.indexOf("--mode") + 1], "json");
    assert.ok(argv.includes("-p"));
    assert.ok(argv.includes("--approve"));
    assert.ok(argv.some((a) => a === "@/repo/.harness-swarm/runs/r1/brief.md"));
    assert.equal(built.cwd, "/repo/.harness-swarm/worktrees/r1");
  });

  it("grok: --cwd, --prompt-file, --always-approve, json output; not --worktree", () => {
    const built = buildCommand(base({ name: "grok", executable: "grok" }));
    const argv = built.argv;
    assert.equal(argv[0], "grok");
    assert.ok(argv.includes("--cwd"));
    assert.equal(argv[argv.indexOf("--cwd") + 1], "/repo/.harness-swarm/worktrees/r1");
    assert.ok(argv.includes("--prompt-file"));
    assert.equal(argv[argv.indexOf("--prompt-file") + 1], "/repo/.harness-swarm/runs/r1/brief.md");
    assert.ok(argv.includes("--always-approve"));
    assert.ok(argv.includes("--output-format"));
    assert.equal(argv[argv.indexOf("--output-format") + 1], "json");
    assert.ok(!argv.includes("--worktree"));
    assert.ok(!argv.includes("-p"));
  });
});
