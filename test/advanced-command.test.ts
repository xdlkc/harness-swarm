import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCommand } from "../src/build-command.js";
import { HARNESS_NAMES, type BuildCommandInput } from "../src/types.js";

const input = (extra: Partial<BuildCommandInput> & Pick<BuildCommandInput, "name">): BuildCommandInput => ({
  executable: extra.name, promptText: 'Use "quotes"\nand $literal text', briefPath: "/repo/run/brief.md",
  runDir: "/repo/run", runId: "r1", worktreePath: "/repo/worktree", ...extra,
});

describe("advanced command options", () => {
  for (const name of HARNESS_NAMES) {
    it(`${name}: preserves native arguments`, () => {
      const args = name === "dsh" ? ["--patch", "/my config/overlay.yml"] : ["--custom-option=literal value"];
      const built = buildCommand(input({ name, nativeArgs: args }));
      const index = built.argv.indexOf(args[0]);
      assert.ok(index >= 0);
      assert.deepEqual(built.argv.slice(index, index + args.length), args);
    });
  }
  it("maps reasoning and token/dollar budget for Claude and drops persistence suppression", () => {
    const built = buildCommand(input({ name: "claude", effort: "high", tokenBudget: 4000, maxBudgetUsd: 2.5, persistSession: true }));
    for (const [flag, value] of [["--effort", "high"], ["--task-budget", "4000"], ["--max-budget-usd", "2.5"]]) {
      assert.equal(built.argv[built.argv.indexOf(flag) + 1], value);
    }
    assert.ok(!built.argv.includes("--no-session-persistence"));
  });
  it("explicit native permission mode replaces automatic bypass", () => {
    const built = buildCommand(input({ name: "claude", nativeArgs: ["--permission-mode", "dontAsk"] }));
    assert.ok(!built.argv.includes("--dangerously-skip-permissions"));
  });
  it("Codex reasoning is TOML encoded, including quotes", () => {
    const built = buildCommand(input({ name: "codex", effort: 'high"quoted' }));
    assert.ok(built.argv.includes('model_reasoning_effort="high\\"quoted"'));
  });
  it("Kimi inherits the configured home and authentication", () => {
    assert.equal(buildCommand(input({ name: "kimi" })).env.KIMI_CODE_HOME, undefined);
  });
  it("creates Claude and Kimi goal prompts", () => {
    for (const name of ["claude", "kimi"] as const) {
      const built = buildCommand(input({ name, goal: true, promptText: "make tests pass" }));
      assert.ok(built.argv.includes("/goal make tests pass"));
    }
  });
  it("rejects unsupported fields instead of dropping constraints", () => {
    assert.throws(() => buildCommand(input({ name: "dsh", model: "anything" })), /does not support model/);
    assert.throws(() => buildCommand(input({ name: "opencode", maxTurns: 5 })), /does not support max_turns/);
    assert.throws(() => buildCommand(input({ name: "pi", goal: true })), /does not support goal/);
  });
  it("rejects worktree overrides, duplicate fields and native command injection", () => {
    for (const nativeArgs of [["--cd=/tmp/elsewhere"], ["-C/tmp/elsewhere"], ["--", "resume"], ["resume"], ["--strict-config", "review"], ["--strict-config", "resume"]]) {
      assert.throws(() => buildCommand(input({ name: "codex", nativeArgs })));
    }
    assert.throws(() => buildCommand(input({ name: "claude", model: "x", nativeArgs: ["--model=y"] })), /duplicates/);
  });
});
