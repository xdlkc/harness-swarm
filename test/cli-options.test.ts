import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { callMcpTool, parseMcpRunOptions, RUN_HARNESS_SCHEMA } from "../src/mcp-tools.js";
import { parseRunFlags, validateRunOptions } from "../src/options.js";
import type { RunHarnessOptions } from "../src/dispatch.js";

const cli = fileURLToPath(new URL("../src/cli.js", import.meta.url));

function invoke(argv: string[]) {
  return spawnSync(process.execPath, [cli, ...argv], { encoding: "utf8" });
}

describe("CLI input contract", () => {
  it("prints advanced input help without dispatching", () => {
    const result = invoke(["--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--native-args/);
    assert.match(result.stdout, /--token-budget/);
  });

  it("rejects unknown flags before checking required values", () => {
    const result = invoke(["run", "--typo", "x"]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown option.*typo/);
  });
});

describe("MCP input contract", () => {
  it("does not coerce prompt to a string", async () => {
    const result = await callMcpTool("run_harness", { name: "qoder", prompt: 7, repo_root: 4 });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.message, /prompt.*string/);
  });
});


describe("shared run option validation", () => {
  const base = { name: "claude", prompt: "task" } as const;

  it("preserves prompt, quoted native values, and typed advanced fields across both entry points", () => {
    const prompt = '--help\nKeep "quotes", $HOME, and `command` literally.';
    const nativeArgs = ["--append-system-prompt", 'A "quoted" line\nsecond line', ""];
    const expected = {
      name: "claude", prompt, repoRoot: "/tmp/repo", model: "model-id", maxTurns: 3, timeoutMs: 4000,
      effort: "high", goal: true, tokenBudget: 1200, maxBudgetUsd: 0.75, persistSession: false, nativeArgs,
    };
    const parsed = parseRunFlags([
      "--name", "claude", `--prompt=${prompt}`, "--repo", "/tmp/repo", "--model", "model-id",
      "--max-turns", "3", "--timeout-ms", "4000", "--effort", "high", "--goal",
      "--token-budget", "1200", "--max-budget-usd", "0.75", "--persist-session=false",
      "--native-args", JSON.stringify(nativeArgs),
    ]);
    assert.deepEqual(parsed, expected);
    assert.deepEqual(parseMcpRunOptions({
      name: "claude", prompt, repo_root: "/tmp/repo", model: "model-id", max_turns: 3, timeout_ms: 4000,
      effort: "high", goal: true, token_budget: 1200, max_budget_usd: 0.75, persist_session: false,
      native_args: nativeArgs,
    }), { ...expected, executable: undefined, extraEnv: undefined });
  });

  it("keeps everything after -- as native argv without parsing it", () => {
    const result = parseRunFlags(["--name", "codex", "--prompt", "task", "--", "--help", "x y", "--goal=false"]);
    assert.notEqual(result, "help");
    if (result !== "help") assert.deepEqual(result.nativeArgs, ["--help", "x y", "--goal=false"]);
    assert.throws(() => parseRunFlags(["--native-args", "[]", "--", "--foo"]), /cannot be combined/);
  });

  it("supports explicit false and refuses ambiguous or duplicate flags", () => {
    assert.deepEqual(parseRunFlags(["--name=qoder", "--prompt=task", "--goal", "false", "--persist-session"]), {
      name: "qoder", prompt: "task", goal: false, persistSession: true,
    });
    assert.throws(() => parseRunFlags(["--goal=maybe"]), /true or false/);
    assert.throws(() => parseRunFlags(["--name", "qoder", "--name", "claude"]), /duplicate/);
    assert.throws(() => parseRunFlags(["stray"]), /unexpected/);
    assert.throws(() => parseRunFlags(["--prompt", "--leading"]), /--prompt=\.\.\./);
  });

  it("rejects unknown object fields and malformed optional values", () => {
    const cases: Record<string, unknown>[] = [
      { typo: "ignored before" }, { prompt: " \n " }, { prompt: 2 }, { name: 3 },
      { effort: 3 }, { model: "" }, { repoRoot: [] }, { executable: null },
      { goal: "false" }, { persistSession: 1 }, { nativeArgs: "--foo" },
      { nativeArgs: [1] }, { nativeArgs: ["a\0b"] }, { extraEnv: { KEY: 3 } },
      { extraEnv: { "BAD=KEY": "value" } },
    ];
    for (const extra of cases) {
      assert.throws(() => validateRunOptions({ ...base, ...extra } as RunHarnessOptions), JSON.stringify(extra));
    }
  });

  it("rejects non-finite, fractional, zero and negative integer limits", () => {
    for (const field of ["maxTurns", "timeoutMs", "tokenBudget"] as const) {
      for (const value of [NaN, Infinity, -Infinity, -1, 0, 1.5, "3", null, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => validateRunOptions({ ...base, [field]: value } as RunHarnessOptions), `${field}=${value}`);
      }
    }
    assert.doesNotThrow(() => validateRunOptions({ name: "qoder", prompt: "task", maxTurns: 0 }));
    for (const value of [NaN, Infinity, -1, 0, "0.5", null]) {
      assert.throws(() => validateRunOptions({ ...base, maxBudgetUsd: value } as RunHarnessOptions));
    }
    assert.doesNotThrow(() => validateRunOptions({ ...base, maxBudgetUsd: 0.5 }));
  });

  it("rejects invalid numeric CLI values and non-array native JSON", () => {
    for (const flag of ["--max-turns", "--timeout-ms", "--token-budget", "--max-budget-usd"]) {
      for (const value of ["NaN", "Infinity", "-1", "", "nope"]) {
        assert.throws(() => parseRunFlags(["--name", "claude", "--prompt", "task", `${flag}=${value}`]));
      }
    }
    for (const value of ['{}', '[1]', '"text"', 'null', 'bad json']) {
      assert.throws(() => parseRunFlags(["--name", "claude", "--prompt", "task", "--native-args", value]));
    }
  });
});

describe("MCP strict schema and runtime inputs", () => {
  it("advertises every advanced field with strict types", () => {
    assert.equal(RUN_HARNESS_SCHEMA.additionalProperties, false);
    assert.equal(RUN_HARNESS_SCHEMA.properties.max_turns.type, "integer");
    assert.equal(RUN_HARNESS_SCHEMA.properties.goal.type, "boolean");
    assert.equal(RUN_HARNESS_SCHEMA.properties.native_args.items.type, "string");
    assert.equal(RUN_HARNESS_SCHEMA.properties.max_budget_usd.exclusiveMinimum, 0);
    for (const field of ["effort", "token_budget", "persist_session"] as const) {
      assert.ok(RUN_HARNESS_SCHEMA.properties[field]);
    }
  });

  it("returns invalid-params without dispatching for unknown fields and incorrect JSON types", async () => {
    const invalid = [
      { typo: 1 }, { name: 3 }, { prompt: ["task"] }, { repo_root: 1 },
      { max_turns: "3" }, { timeout_ms: false }, { token_budget: null },
      { max_budget_usd: "0.5" }, { effort: [] }, { goal: "true" },
      { persist_session: 1 }, { native_args: [false] },
    ];
    for (const extra of invalid) {
      const result = await callMcpTool("run_harness", { name: "qoder", prompt: "task", repo_root: "/not-used", ...extra });
      assert.equal(result.ok, false, JSON.stringify(extra));
      if (!result.ok) assert.equal(result.code, -32602);
    }
    assert.equal((await callMcpTool("list_harnesses", { ignored: true })).ok, false);
  });
});

describe("CLI process outcomes", () => {
  it("rejects invalid flags and numbers before dispatch", () => {
    for (const argv of [
      ["list", "--unknown"], ["run", "--name", "qoder", "--prompt", "task", "--timeout-ms", "NaN"],
      ["run", "--name", "qoder", "--prompt", "task", "--native-args", "{}"],
    ]) {
      const result = invoke(argv);
      assert.notEqual(result.status, 0);
      assert.equal(result.stdout, "");
    }
  });

  it("returns a failing process status while preserving failed harness evidence", (t) => {
    const root = mkdtempSync(path.join(os.tmpdir(), "harness-cli-exit-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    for (const argv of [["init"], ["config", "user.email", "test@example.com"], ["config", "user.name", "Test"]]) {
      assert.equal(spawnSync("git", argv, { cwd: root, encoding: "utf8" }).status, 0);
    }
    writeFileSync(path.join(root, "README.md"), "fixture\n");
    assert.equal(spawnSync("git", ["add", "."], { cwd: root }).status, 0);
    assert.equal(spawnSync("git", ["commit", "-m", "fixture"], { cwd: root }).status, 0);
    const executable = path.join(root, "stub");
    writeFileSync(executable, '#!/usr/bin/env node\nconsole.log("stub failure"); process.exit(7);\n');
    chmodSync(executable, 0o755);
    const result = invoke(["run", "--name", "qoder", "--prompt", "task", "--repo", root, "--executable", executable]);
    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, "");
    const evidence = JSON.parse(result.stdout);
    assert.equal(evidence.exit_code, 7);
    assert.match(evidence.summary, /stub failure/);
  });
});
