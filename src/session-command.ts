import type { BuiltCommand, HarnessName } from "./types.js";

/**
 * Builds the native argv for resuming or forking a session into a fresh worktree.
 * This is the write path of `hs sessions resume|fork`; the read path lives in sessions.ts.
 */
export interface SessionBuildInput {
  name: HarnessName;
  action: "resume" | "fork";
  sessionId: string;
  promptText: string;
  worktreePath: string;
  briefPath: string;
  runId: string;
  executable: string;
  model?: string;
}

function requireAction(input: SessionBuildInput, allowed: ("resume" | "fork")[]): void {
  if (!allowed.includes(input.action)) {
    throw new Error(`${input.name} does not support session ${input.action}`);
  }
}

export function buildSessionCommand(input: SessionBuildInput): BuiltCommand {
  switch (input.name) {
    case "qoder":
      return buildQoderSession(input);
    case "kimi":
      return buildKimiSession(input);
    case "pi":
      return buildPiSession(input);
    case "grok":
      return buildGrokSession(input);
    case "codex":
      return buildCodexSession(input);
    case "claude":
      return buildClaudeSession(input);
    case "opencode2":
      return buildOpenCode2Session(input);
    default:
      throw new Error(`${input.name} does not support session ${input.action}`);
  }
}

function buildQoderSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume"]);
  const argv = [
    input.executable, "-r", input.sessionId,
    "-w", input.worktreePath, "-p", input.promptText, "-f", "json", "--quiet", "--yolo",
  ];
  if (input.model) argv.push("--model", input.model);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["qoder resumes the conversation; the worktree is fresh"] };
}

function buildKimiSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume"]);
  const argv = [
    input.executable, "--session", input.sessionId, "-p", input.promptText, "--output-format", "stream-json",
  ];
  if (input.model) argv.push("-m", input.model);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["kimi --session resumes the conversation in a fresh worktree"] };
}

function buildPiSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume", "fork"]);
  const argv = [
    input.executable, "--mode", "json", "-p", "--exclude-tools", "ask_question",
    input.action === "resume" ? "--session" : "--fork", input.sessionId,
    "--name", `harness-${input.runId}`,
    `@${input.briefPath}`,
    "Execute the brief. Do not ask questions.",
    "--approve",
  ];
  if (input.model) argv.push("--model", input.model);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["pi session lookup uses the default session store (no --session-dir override)"] };
}

function buildGrokSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume", "fork"]);
  const argv = [
    input.executable, "--cwd", input.worktreePath, "--prompt-file", input.briefPath,
    "--output-format", "json", "--verbatim",
    "--resume", input.sessionId,
    ...(input.action === "fork" ? ["--fork-session"] : []),
    "--no-subagents", "--always-approve",
  ];
  if (input.model) argv.push("-m", input.model);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["grok resumes the conversation; --fork-session creates a new session id"] };
}

function buildCodexSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume", "fork"]);
  const sub = input.action === "resume" ? "resume" : "fork";
  const argv = [
    input.executable, "exec", sub, "--json",
    "--cd", input.worktreePath,
    "--dangerously-bypass-approvals-and-sandbox",
  ];
  if (input.model) argv.push("--model", input.model);
  argv.push(input.sessionId, "--", input.promptText);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["codex exec resume/fork is a subcommand; the worktree is fresh"] };
}

function buildClaudeSession(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume", "fork"]);
  const argv = [
    input.executable, "-p", "--output-format", "json",
    "--dangerously-skip-permissions",
    "--resume", input.sessionId,
    ...(input.action === "fork" ? ["--fork-session"] : []),
  ];
  if (input.model) argv.push("--model", input.model);
  argv.push("--", input.promptText);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["claude resumes with session persistence; --fork-session creates a new session id"] };
}

function buildOpenCode2Session(input: SessionBuildInput): BuiltCommand {
  requireAction(input, ["resume", "fork"]);
  const argv = [
    input.executable, "run", "--format", "json",
    "--session", input.sessionId,
    ...(input.action === "fork" ? ["--fork"] : []),
    "--auto",
  ];
  if (input.model) argv.push("--model", input.model);
  argv.push("--", input.promptText);
  return { argv, cwd: input.worktreePath, env: {}, notes: ["opencode2 run has no --dir; cwd is the worktree"] };
}
