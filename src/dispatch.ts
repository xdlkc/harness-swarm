import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { buildCommand, getTaskPrompt } from "./build-command.js";
import { validateRunOptions } from "./options.js";
import { validateCapabilities } from "./capabilities.js";
import { resolveExecutable } from "./list-harnesses.js";
import { redactArgv, kimiGoalStatus } from "./evidence.js";
import { runCodexGoal, validateCodexGoalNativeArgs, buildCodexGoalArgv } from "./codex-goal.js";
import { buildSessionCommand } from "./session-command.js";
import { SESSION_CAPABILITIES } from "./sessions.js";
import { HARNESS_BINARIES, HARNESS_NAMES, isHarnessName, type BuiltCommand, type Evidence, type HarnessName } from "./types.js";

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

export interface RunSessionOptions {
  name: HarnessName;
  action: "resume" | "fork";
  sessionId: string;
  prompt: string;
  repoRoot?: string;
  executable?: string;
  model?: string;
  timeoutMs?: number;
  extraEnv?: Record<string, string>;
}

interface SpawnOutcome {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  goalStatus?: string;
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
  const executable = resolveExecutable(opts.executable ?? HARNESS_BINARIES[opts.name], opts.extraEnv?.PATH);
  if (!executable) throw new Error(`Harness executable not found: ${opts.executable ?? HARNESS_BINARIES[opts.name]}`);
  accessSync(executable, constants.X_OK);
  const repoRoot = resolveTargetRepoRoot({
    repoRoot: opts.repoRoot,
    env: opts.extraEnv ? { ...process.env, ...opts.extraEnv } : process.env,
  });
  const runId = newRunId();
  const branch = `harness/${opts.name}/${runId}`;
  const swarmRoot = path.join(repoRoot, ".harness-swarm");
  const worktree = path.join(swarmRoot, "worktrees", runId);
  const runDir = path.join(swarmRoot, "runs", runId);
  const briefPath = path.join(runDir, "brief.md");
  const seedsSession = opts.name === "grok"
    || (opts.name === "pi" && opts.persistSession !== false)
    || (opts.name === "claude" && opts.persistSession === true);
  const nativeSessionId = seedsSession ? randomUUID() : undefined;
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
    sessionId: nativeSessionId,
  });
  const timeoutMs = opts.timeoutMs ?? 1_200_000;
  return finalizeEvidence({
    name: opts.name, repoRoot, worktree, runDir, runId, branch, briefPath,
    taskPrompt, built, timeoutMs, extraEnv: opts.extraEnv, nativeSessionId,
    spawn: async (processEnv, logPath) => {
      if (codexGoal) {
        return runCodexGoal({
          executable, cwd: worktree, prompt: opts.prompt, model: opts.model, effort: opts.effort,
          tokenBudget: opts.tokenBudget, nativeArgs: opts.nativeArgs, timeoutMs, logPath, env: processEnv,
        });
      }
      const result = await spawnLogged({ argv: built.argv, cwd: built.cwd, env: processEnv, timeoutMs, logPath });
      if (opts.goal && opts.name === "kimi") {
        const goalStatus = kimiGoalStatus(result.stdout);
        if (goalStatus !== "complete" && result.exitCode === 0) {
          built.notes.push("Kimi did not report a complete goal.summary event");
          return { ...result, exitCode: 1, goalStatus };
        }
        if (goalStatus) return { ...result, goalStatus };
      }
      return result;
    },
  });
}

export async function runSession(opts: RunSessionOptions): Promise<Evidence> {
  validateSessionOptions(opts);
  const caps = SESSION_CAPABILITIES[opts.name];
  if (!caps || (opts.action === "resume" && !caps.resume) || (opts.action === "fork" && !caps.fork)) {
    throw new Error(`${opts.name} does not support session ${opts.action}`);
  }
  const executable = resolveExecutable(opts.executable ?? HARNESS_BINARIES[opts.name], opts.extraEnv?.PATH);
  if (!executable) throw new Error(`Harness executable not found: ${opts.executable ?? HARNESS_BINARIES[opts.name]}`);
  accessSync(executable, constants.X_OK);
  const repoRoot = resolveTargetRepoRoot({
    repoRoot: opts.repoRoot,
    env: opts.extraEnv ? { ...process.env, ...opts.extraEnv } : process.env,
  });
  const runId = newRunId();
  const branch = `harness/${opts.name}/${runId}`;
  const swarmRoot = path.join(repoRoot, ".harness-swarm");
  const worktree = path.join(swarmRoot, "worktrees", runId);
  const runDir = path.join(swarmRoot, "runs", runId);
  const briefPath = path.join(runDir, "brief.md");
  const built = buildSessionCommand({
    name: opts.name, action: opts.action, sessionId: opts.sessionId,
    promptText: opts.prompt, worktreePath: worktree, briefPath, runId, executable,
    model: opts.model,
  });
  const timeoutMs = opts.timeoutMs ?? 1_200_000;
  const nativeSessionId = opts.action === "resume" ? opts.sessionId : undefined;
  return finalizeEvidence({
    name: opts.name, repoRoot, worktree, runDir, runId, branch, briefPath,
    taskPrompt: opts.prompt, built, timeoutMs, extraEnv: opts.extraEnv, nativeSessionId,
    session: { action: opts.action, id: opts.sessionId },
    spawn: (processEnv, logPath) => spawnLogged({ argv: built.argv, cwd: built.cwd, env: processEnv, timeoutMs, logPath }),
  });
}

function validateSessionOptions(opts: RunSessionOptions): void {
  if (!isHarnessName(opts.name)) throw new Error(`name must be ${HARNESS_NAMES.join("|")}`);
  if (opts.action !== "resume" && opts.action !== "fork") throw new Error("session action must be resume or fork");
  if (typeof opts.sessionId !== "string" || opts.sessionId.trim() === "" || opts.sessionId.includes("\0")) {
    throw new Error("sessionId must be a nonempty string without NUL characters");
  }
  if (typeof opts.prompt !== "string" || opts.prompt.trim() === "" || opts.prompt.includes("\0")) {
    throw new Error("prompt must be a nonempty string without NUL characters");
  }
  for (const field of ["repoRoot", "executable", "model"] as const) {
    if (opts[field] !== undefined && (typeof opts[field] !== "string" || opts[field].trim() === "" || opts[field].includes("\0"))) {
      throw new Error(`${field} must be a nonempty string without NUL characters`);
    }
  }
  if (opts.timeoutMs !== undefined && (!Number.isSafeInteger(opts.timeoutMs) || opts.timeoutMs <= 0)) {
    throw new Error("timeoutMs must be a positive safe integer");
  }
}

async function finalizeEvidence(params: {
  name: HarnessName;
  repoRoot: string;
  worktree: string;
  runDir: string;
  runId: string;
  branch: string;
  briefPath: string;
  taskPrompt: string;
  built: BuiltCommand;
  timeoutMs: number;
  extraEnv?: Record<string, string>;
  nativeSessionId?: string;
  session?: { action: "resume" | "fork"; id: string };
  spawn: (processEnv: NodeJS.ProcessEnv, logPath: string) => Promise<SpawnOutcome>;
}): Promise<Evidence> {
  const started = new Date();
  const baseSha = gitOrThrow(params.repoRoot, ["rev-parse", "HEAD"]);
  mkdirSync(params.runDir, { recursive: true });
  mkdirSync(path.dirname(params.worktree), { recursive: true });
  gitOrThrow(params.repoRoot, ["worktree", "add", "-b", params.branch, params.worktree, "HEAD"]);
  writeFileSync(params.briefPath, params.taskPrompt, "utf8");
  const logPath = path.join(params.runDir, "run.log");
  const processEnv = { ...process.env, ...params.built.env, ...params.extraEnv };
  const spawnResult = await params.spawn(processEnv, logPath);
  const headSha = gitOrThrow(params.worktree, ["rev-parse", "HEAD"]);
  gitOrThrow(params.worktree, ["add", "-A"]);
  const diffStat = gitOrThrow(params.worktree, ["diff", "--cached", "--stat", baseSha]);
  const diff = gitOrThrow(params.worktree, ["diff", "--cached", baseSha]);
  gitOrThrow(params.worktree, ["reset", "-q", "HEAD"]);
  const diffPath = path.join(params.runDir, "diff.patch");
  writeFileSync(diffPath, diff, "utf8");
  const finished = new Date();
  const evidence: Evidence = {
    run_id: params.runId,
    harness: params.name,
    worktree: params.worktree,
    branch: params.branch,
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
    argv: redactArgv(params.built.argv),
    notes: params.built.notes,
    ...(spawnResult.goalStatus ? { goal_status: String(spawnResult.goalStatus) } : {}),
    ...(params.nativeSessionId ? { native_session_id: params.nativeSessionId } : {}),
    ...(params.session ? { session: params.session } : {}),
  };
  writeFileSync(path.join(params.runDir, "evidence.json"), JSON.stringify(evidence, null, 2));
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
