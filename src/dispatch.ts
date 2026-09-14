import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { buildCommand, getTaskPrompt } from "./build-command.js";
import { validateRunOptions } from "./options.js";
import { validateCapabilities } from "./capabilities.js";
import { which } from "./list-harnesses.js";
import { redactArgv, kimiGoalStatus } from "./evidence.js";
import { runCodexGoal, validateCodexGoalNativeArgs, buildCodexGoalArgv } from "./codex-goal.js";
import { HARNESS_BINARIES, type Evidence, type HarnessName } from "./types.js";

export interface RunHarnessOptions {
  name: HarnessName;
  prompt: string;
  repoRoot?: string;
  executable?: string;
  model?: string;
  maxTurns?: number;
  timeoutMs?: number;
  extraEnv?: Record<string, string>;
  effort?: string;
  goal?: boolean;
  tokenBudget?: number;
  maxBudgetUsd?: number;
  persistSession?: boolean;
  nativeArgs?: string[];
}

function runGit(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSyncGit(cwd, args);
  return result;
}

function spawnSyncGit(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function gitOrThrow(cwd: string, args: string[]): string {
  const result = runGit(cwd, args);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return `${stamp}-${randomBytes(3).toString("hex")}`;
}

function summarize(stdout: string, stderr: string): string {
  const text = stdout.trim() || stderr.trim();
  if (text.length <= 4000) {
    return text;
  }
  return `${text.slice(0, 4000)}\n…[truncated]`;
}

export function resolveTargetRepoRoot(opts: {
  repoRoot?: string;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
} = {}): string {
  if (opts.repoRoot) {
    return opts.repoRoot;
  }
  const env = opts.env ?? process.env;
  const workspace = env.CODEX_WORKSPACE_ROOT?.trim();
  if (workspace) {
    return workspace;
  }
  return gitOrThrow(opts.cwd ?? process.cwd(), ["rev-parse", "--show-toplevel"]);
}

export async function runHarness(opts: RunHarnessOptions): Promise<Evidence> {
  validateRunOptions(opts);
  validateCapabilities(opts);
  const codexGoal = opts.name === "codex" && opts.goal === true;
  if (codexGoal) validateCodexGoalNativeArgs(opts.nativeArgs ?? []);
  const taskPrompt = getTaskPrompt({ ...opts, promptText: opts.prompt });
  const executable = which(opts.executable ?? HARNESS_BINARIES[opts.name], opts.extraEnv?.PATH);
  if (!executable) throw new Error(`Harness executable not found: ${opts.executable ?? HARNESS_BINARIES[opts.name]}`);
  accessSync(executable, constants.X_OK);
  const repoRoot = resolveTargetRepoRoot({
    repoRoot: opts.repoRoot,
    env: opts.extraEnv ? { ...process.env, ...opts.extraEnv } : process.env,
  });
  const started = new Date();
  const runId = newRunId();
  const branch = `harness/${opts.name}/${runId}`;
  const swarmRoot = path.join(repoRoot, ".harness-swarm");
  const worktree = path.join(swarmRoot, "worktrees", runId);
  const runDir = path.join(swarmRoot, "runs", runId);
  const briefPath = path.join(runDir, "brief.md");
  const built = codexGoal ? {
    argv: buildCodexGoalArgv(executable, opts.nativeArgs ?? []), cwd: worktree, env: {},
    notes: ["Codex Goal uses a persistent App Server thread and confirmed protocol goal status"],
  } : buildCommand({
    ...opts,
    briefPath,
    promptText: opts.prompt,
    worktreePath: worktree,
    runDir,
    runId,
    executable,
    model: opts.model,
    maxTurns: opts.maxTurns,
  });

  const baseSha = gitOrThrow(repoRoot, ["rev-parse", "HEAD"]);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(path.dirname(worktree), { recursive: true });
  gitOrThrow(repoRoot, ["worktree", "add", "-b", branch, worktree, "HEAD"]);
  writeFileSync(briefPath, taskPrompt, "utf8");

  const logPath = path.join(runDir, "run.log");
  const timeoutMs = opts.timeoutMs ?? 1_200_000;
  const processEnv = { ...process.env, ...built.env, ...opts.extraEnv };
  const spawnResult = codexGoal ? await runCodexGoal({
    executable, cwd: worktree, prompt: opts.prompt, model: opts.model, effort: opts.effort,
    tokenBudget: opts.tokenBudget, nativeArgs: opts.nativeArgs, timeoutMs, logPath, env: processEnv,
  }) : await spawnLogged({
    argv: built.argv,
    cwd: built.cwd,
    env: processEnv,
    timeoutMs,
    logPath,
  });
  const goalStatus = "goalStatus" in spawnResult ? spawnResult.goalStatus
    : opts.goal && opts.name === "kimi" ? kimiGoalStatus(spawnResult.stdout) : undefined;
  if (opts.goal && opts.name === "kimi" && goalStatus !== "complete" && spawnResult.exitCode === 0) {
    spawnResult.exitCode = 1;
    built.notes.push("Kimi did not report a complete goal.summary event");
  }

  const headSha = gitOrThrow(worktree, ["rev-parse", "HEAD"]);
  gitOrThrow(worktree, ["add", "-A"]);
  const diffStat = gitOrThrow(worktree, ["diff", "--cached", "--stat", baseSha]);
  const diff = gitOrThrow(worktree, ["diff", "--cached", baseSha]);
  gitOrThrow(worktree, ["reset", "-q", "HEAD"]);
  const diffPath = path.join(runDir, "diff.patch");
  writeFileSync(diffPath, diff, "utf8");

  const finished = new Date();
  const evidence: Evidence = {
    run_id: runId,
    harness: opts.name,
    worktree,
    branch,
    base_sha: baseSha,
    head_sha: headSha,
    exit_code: spawnResult.exitCode,
    timed_out: spawnResult.timedOut,
    summary: summarize(spawnResult.stdout, spawnResult.stderr),
    diff_stat: diffStat,
    diff_path: diffPath,
    log_path: logPath,
    started_at: started.toISOString(),
    finished_at: finished.toISOString(),
    argv: redactArgv(built.argv),
    notes: built.notes,
    ...(goalStatus ? { goal_status: String(goalStatus) } : {}),
  };
  writeFileSync(path.join(runDir, "evidence.json"), JSON.stringify(evidence, null, 2));
  return evidence;
}

function spawnLogged(opts: {
  argv: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  logPath: string;
}): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }> {
  const [cmd, ...args] = opts.argv;
  if (!cmd) {
    throw new Error("empty argv");
  }
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let spawnFailed = false;
    let killTimer: NodeJS.Timeout | undefined;
    const kill = (signal: NodeJS.Signals): void => {
      try {
        if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch { /* The process may already have exited. */ }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill("SIGTERM");
      killTimer = setTimeout(() => {
        kill("SIGKILL");
      }, 2000);
    }, opts.timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      spawnFailed = true;
      stderr += `\n${err.message}`;
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
    });
    child.on("close", (code) => {
      if (timedOut) kill("SIGKILL");
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      writeFileSync(
        opts.logPath,
        `argv: ${JSON.stringify(redactArgv(opts.argv))}\ncwd: ${opts.cwd}\n\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}\n`,
      );
      resolve({ exitCode: timedOut ? 124 : spawnFailed ? 1 : code ?? 1, stdout, stderr, timedOut });
    });
  });
}
