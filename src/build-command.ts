import path from "node:path";
import type { BuildCommandInput, BuiltCommand } from "./types.js";

/**
 * Pure command construction. Tests assert argv here without spawning agents.
 */
export function buildCommand(input: BuildCommandInput): BuiltCommand {
  switch (input.name) {
    case "qoder":
      return buildQoder(input);
    case "kimi":
      return buildKimi(input);
    case "pi":
      return buildPi(input);
    case "grok":
      return buildGrok(input);
  }
}

function buildQoder(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable,
    "-w",
    input.worktreePath,
    "-p",
    input.promptText,
    "-f",
    "json",
    "--yolo",
    "--quiet",
  ];
  if (input.maxTurns !== undefined) {
    argv.push("--max-turns", String(input.maxTurns));
  }
  if (input.model) {
    argv.push("--model", input.model);
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: ["qoder uses -w for workspace; do not pass --worktree (concurrent jobs)"],
  };
}

function buildKimi(input: BuildCommandInput): BuiltCommand {
  const argv = [input.executable, "-p", input.promptText, "--output-format", "stream-json"];
  if (input.model) {
    argv.push("-m", input.model);
  }
  const forbidden = ["--yolo", "--auto", "--plan"];
  for (const flag of forbidden) {
    if (argv.includes(flag)) {
      throw new Error(`kimi -p must not include ${flag}`);
    }
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {
      KIMI_CODE_HOME: path.join(input.runDir, "kimi-home"),
    },
    notes: [
      "kimi -p already uses auto permissions; --yolo/--auto/--plan are rejected at startup",
      "kimi-code has no -w; cwd is the worktree",
    ],
  };
}

function buildPi(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable,
    "--mode",
    "json",
    "-p",
    "--approve",
    "--exclude-tools",
    "ask_question",
    "--session-dir",
    path.join(input.runDir, "pi-sessions"),
    "--name",
    `harness-${input.runId}`,
    `@${input.briefPath}`,
    "Execute the brief. Do not ask questions.",
  ];
  if (input.model) {
    argv.push("--model", input.model);
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: ["pi --approve trusts AGENTS.md; it is not a yolo alias"],
  };
}

function buildGrok(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable,
    "--cwd",
    input.worktreePath,
    "--prompt-file",
    input.briefPath,
    "--output-format",
    "json",
    "--always-approve",
    "--no-subagents",
    "--verbatim",
  ];
  if (input.maxTurns !== undefined) {
    argv.push("--max-turns", String(input.maxTurns));
  }
  if (input.model) {
    argv.push("-m", input.model);
  }
  if (argv.includes("--worktree") || argv.includes("-w")) {
    throw new Error("grok headless must not pass --worktree; use --cwd");
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: [
      "grok -p/--prompt-file does not create a worktree from --worktree",
      "this grok build uses --always-approve, not --yolo",
    ],
  };
}
