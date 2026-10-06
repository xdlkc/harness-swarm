import type { BuildCommandInput, BuiltCommand } from "./types.js";
import { hasNative, validateCapabilities } from "./capabilities.js";

export function getTaskPrompt(input: Pick<BuildCommandInput, "name" | "goal" | "promptText" | "tokenBudget">): string {
  if (!input.goal) return input.promptText;
  if (["codex", "claude", "kimi"].includes(input.name) && Array.from(input.promptText).length > 4000) throw new Error("Goal objective exceeds the harness limit of 4000 characters");
  if (input.name === "codex") return input.promptText;
  if (/^\s*\/goal\b/.test(input.promptText)) throw new Error("With goal=true, prompt must be the objective without /goal");
  if (/^(status|pause|resume|clear|stop|off|reset|none|cancel|next)$/i.test(input.promptText.trim())) throw new Error("goal=true requires an objective, not a goal management command");
  const budget = input.name === "grok" && input.tokenBudget !== undefined ? ` --budget ${input.tokenBudget}` : "";
  return `/goal ${input.promptText}${budget}`;
}

/**
 * Pure command construction. Tests assert argv here without spawning agents.
 */
export function buildCommand(input: BuildCommandInput): BuiltCommand {
  validateCapabilities(input);
  if (input.name === "codex" && input.goal) throw new Error("Codex goals require the App Server executor");
  input = { ...input, promptText: getTaskPrompt(input) };
  const built = buildBaseCommand(input);
  const extra: string[] = [];
  if (input.effort) {
    const flags = { pi: "--thinking", grok: "--reasoning-effort", claude: "--effort", opencode: "--variant" };
    if (input.name === "codex") extra.push("-c", `model_reasoning_effort=${JSON.stringify(input.effort)}`);
    else extra.push(flags[input.name as keyof typeof flags], input.effort);
  }
  if (input.name === "claude") {
    if (input.tokenBudget !== undefined) extra.push("--task-budget", String(input.tokenBudget));
    if (input.maxBudgetUsd !== undefined) extra.push("--max-budget-usd", String(input.maxBudgetUsd));
  }
  extra.push(...input.nativeArgs ?? []);
  let insertAt = built.argv.length;
  if (["codex", "claude", "opencode", "opencode2"].includes(input.name)) insertAt = built.argv.indexOf("--");
  if (input.name === "dsh") insertAt = 1;
  if (input.name === "pi") insertAt = built.argv.indexOf(`@${input.briefPath}`);
  built.argv.splice(insertAt, 0, ...extra);
  if (input.goal) built.notes.push("Native goal requested; inspect harness output for its completion verdict");
  return built;
}

function buildBaseCommand(input: BuildCommandInput): BuiltCommand {
  switch (input.name) {
    case "qoder":
      return buildQoder(input);
    case "kimi":
      return buildKimi(input);
    case "pi":
      return buildPi(input);
    case "grok":
      return buildGrok(input);
    case "codex":
      return buildCodex(input);
    case "claude":
      return buildClaude(input);
    case "dsh":
      return buildDsh(input);
    case "opencode":
      return buildOpenCode(input);
    case "opencode2":
      return buildOpenCode2(input);
  }
}

function buildCodex(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable, "exec", "--json",
  ];
  if (!input.persistSession) argv.push("--ephemeral");
  if (!hasNative(input.nativeArgs ?? [], ["--sandbox", "-s", "--ask-for-approval", "-a", "--approve-for-me", "--dangerously-bypass-approvals-and-sandbox"])) argv.push("--dangerously-bypass-approvals-and-sandbox");
  argv.push("--cd", input.worktreePath);
  if (input.model) {
    argv.push("--model", input.model);
  }
  argv.push("--", input.promptText);
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: [],
  };
}

function buildClaude(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable, "-p", "--output-format", input.goal ? "stream-json" : "json",
  ];
  if (input.goal && !hasNative(input.nativeArgs ?? [], ["--verbose"])) argv.push("--verbose");
  if (!hasNative(input.nativeArgs ?? [], ["--permission-mode", "--dangerously-skip-permissions"])) argv.push("--dangerously-skip-permissions");
  if (input.sessionId) argv.push("--session-id", input.sessionId);
  if (!input.persistSession) argv.push("--no-session-persistence");
  if (input.model) {
    argv.push("--model", input.model);
  }
  if (input.maxTurns !== undefined) {
    argv.push("--max-turns", String(input.maxTurns));
  }
  argv.push("--", input.promptText);
  return { argv, cwd: input.worktreePath, env: {}, notes: [] };
}

function buildDsh(input: BuildCommandInput): BuiltCommand {
  const notes = ["dsh headless prints the final assistant text; model and permissions come from its profile"];
  return {
    // The launcher and the headless app each parse argv and consume one separator.
    argv: [input.executable, "--profile", "headless", "--", "--", input.promptText],
    cwd: input.worktreePath,
    env: {},
    notes,
  };
}

function buildOpenCode(input: BuildCommandInput): BuiltCommand {
  const argv = [input.executable, "run", "--format", "json"];
  if (!hasNative(input.nativeArgs ?? [], ["--auto", "--no-auto", "--yolo", "--dangerously-skip-permissions"])) argv.push("--auto");
  argv.push("--dir", input.worktreePath);
  if (input.model) {
    argv.push("--model", input.model);
  }
  argv.push("--", input.promptText);
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: [],
  };
}

function buildOpenCode2(input: BuildCommandInput): BuiltCommand {
  const argv = [input.executable, "run", "--format", "json"];
  if (!hasNative(input.nativeArgs ?? [], ["--auto"])) argv.push("--auto");
  if (input.model) {
    argv.push("--model", input.model);
  }
  argv.push("--", input.promptText);
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: ["opencode2 run has no --dir; cwd is the worktree"],
  };
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
    "--quiet",
  ];
  if (!hasNative(input.nativeArgs ?? [], ["--yolo", "--dangerously-skip-permissions", "--permission-mode"])) argv.push("--yolo");
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
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: [
      "kimi -p already uses auto permissions; --yolo/--auto/--plan are rejected at startup",
      "kimi-code has no -w; cwd is the worktree",
      "kimi inherits its configured home for model configuration and authentication",
    ],
  };
}

function buildPi(input: BuildCommandInput): BuiltCommand {
  const argv = [
    input.executable,
    "--mode",
    "json",
    "-p",
    "--exclude-tools",
    "ask_question",
    "--name",
    `harness-${input.runId}`,
    `@${input.briefPath}`,
    "Execute the brief. Do not ask questions.",
  ];
  if (input.sessionId) argv.push("--session-id", input.sessionId);
  if (!hasNative(input.nativeArgs ?? [], ["--approve", "-a", "--no-approve", "-na"])) argv.push("--approve");
  if (input.persistSession === false) argv.push("--no-session");
  if (input.model) {
    argv.push("--model", input.model);
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: ["pi sessions go to the default session store so hs can list and resume them"],
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
    input.goal ? "streaming-json" : "json",
    "--verbatim",
  ];
  if (!input.goal && !hasNative(input.nativeArgs ?? [], ["--no-subagents"])) argv.push("--no-subagents");
  if (!hasNative(input.nativeArgs ?? [], ["--permission-mode", "--always-approve", "--yolo", "--dangerously-skip-permissions"])) argv.push("--always-approve");
  if (input.sessionId) argv.push("--session-id", input.sessionId);
  if (input.maxTurns !== undefined) {
    argv.push("--max-turns", String(input.maxTurns));
  }
  if (input.model) {
    argv.push("-m", input.model);
  }
  return {
    argv,
    cwd: input.worktreePath,
    env: {},
    notes: [
      "grok -p/--prompt-file does not create a worktree from --worktree",
      "grok uses --always-approve by default; an explicit native permission mode replaces it",
    ],
  };
}
