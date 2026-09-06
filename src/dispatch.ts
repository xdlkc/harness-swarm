import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { buildCommand } from "./build-command.js";
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

export async function runHarness(opts: RunHarnessOptions): Promise<Evidence> {
  const repoRoot = opts.repoRoot ?? gitOrThrow(process.cwd(), ["rev-parse", "--show-toplevel"]);
  const started = new Date();
  const runId = newRunId();
  const branch = `harness/${opts.name}/${runId}`;
  const swarmRoot = path.join(repoRoot, ".harness-swarm");
  const worktree = path.join(swarmRoot, "worktrees", runId);
  const runDir = path.join(swarmRoot, "runs", runId);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(path.dirname(worktree), { recursive: true });

  const baseSha = gitOrThrow(repoRoot, ["rev-parse", "HEAD"]);
  gitOrThrow(repoRoot, ["worktree", "add", "-b", branch, worktree, "HEAD"]);

  const briefPath = path.join(runDir, "brief.md");
  writeFileSync(briefPath, opts.prompt, "utf8");

  const built = buildCommand({
    name: opts.name,
    briefPath,
    promptText: opts.prompt,
    worktreePath: worktree,
    runDir,
    runId,
    executable: opts.executable ?? HARNESS_BINARIES[opts.name],
    model: opts.model,
    maxTurns: opts.maxTurns,
  });

  const logPath = path.join(runDir, "run.log");
  const timeoutMs = opts.timeoutMs ?? 1_200_000;
  const spawnResult = await spawnLogged({
    argv: built.argv,
    cwd: built.cwd,
    env: { ...process.env, ...built.env, ...opts.extraEnv },
    timeoutMs,
    logPath,
  });

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
    argv: built.argv,
    notes: built.notes,
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
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killTimer: NodeJS.Timeout | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, 2000);
    }, opts.timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      writeFileSync(
        opts.logPath,
        `argv: ${JSON.stringify(opts.argv)}\ncwd: ${opts.cwd}\n\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}\n`,
      );
      resolve({ exitCode: code ?? 1, stdout, stderr, timedOut });
    });
  });
}
