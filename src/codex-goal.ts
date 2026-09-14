import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

export interface CodexGoalOptions {
  executable: string;
  cwd: string;
  prompt: string;
  model?: string;
  effort?: string;
  tokenBudget?: number;
  timeoutMs: number;
  logPath: string;
  env: NodeJS.ProcessEnv;
  nativeArgs?: string[];
}

export interface CodexGoalResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  goalStatus?: string;
}

/** Exec/TUI flags cannot be forwarded to the app-server transport. */
export function validateCodexGoalNativeArgs(args: string[]): void {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--strict-config") continue;
    const equal = arg.indexOf("=");
    const flag = equal < 0 ? arg : arg.slice(0, equal);
    if (!["-c", "--config", "--enable", "--disable"].includes(flag)) {
      throw new Error(`Codex goal native argument ${flag} is unsupported; use --config, --enable, --disable or --strict-config`);
    }
    const value = equal < 0 ? args[++i] : arg.slice(equal + 1);
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    if (flag === "-c" || flag === "--config") {
      if (!/^[A-Za-z0-9_.-]+\s*=/.test(value)) throw new Error(`${flag} requires key=value`);
      const key = value.slice(0, value.indexOf("=")).trim();
      if (key === "features" || key === "features.goals") {
        throw new Error("Codex goal mode owns features.goals; remove this config override");
      }
      if (["cwd", "ephemeral", "approval_policy", "sandbox_mode"].includes(key)) {
        throw new Error(`Codex goal mode owns ${key}; remove this config override`);
      }
    } else if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error(`${flag} requires one feature name`);
    } else if (flag === "--disable" && value === "goals") {
      throw new Error("Codex goal mode cannot disable the goals feature");
    }
  }
}

export function buildCodexGoalArgv(executable: string, nativeArgs: string[] = []): string[] {
  validateCodexGoalNativeArgs(nativeArgs);
  return [executable, "app-server", ...nativeArgs, "--enable", "goals", "--stdio"];
}

const GOAL_STATUSES = new Set(["active", "paused", "blocked", "usageLimited", "budgetLimited", "complete"]);
const CAPTURE_LIMIT = 4 * 1024 * 1024;

type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : {};
}

/**
 * Protocol verified against codex-cli 0.154.0 generated experimental schema.
 * thread/goal/set starts/continues an idle goal itself; sending turn/start would
 * race that first turn. Goals require a persistent (non-ephemeral) thread.
 */
export async function runCodexGoal(opts: CodexGoalOptions): Promise<CodexGoalResult> {
  const [executable, ...args] = buildCodexGoalArgv(opts.executable, opts.nativeArgs);
  if (!opts.prompt.trim() || Array.from(opts.prompt).length > 4000) {
    throw new Error("Codex goal objective must contain 1–4000 characters");
  }
  if (opts.tokenBudget !== undefined && (!Number.isSafeInteger(opts.tokenBudget) || opts.tokenBudget <= 0)) {
    throw new Error("Codex goal tokenBudget must be a positive safe integer");
  }
  if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs <= 0 || opts.timeoutMs > 2_147_483_647) {
    throw new Error("Codex goal timeoutMs must be a positive timer-safe integer");
  }
  if (opts.effort !== undefined && !opts.effort.trim()) throw new Error("Codex goal effort cannot be empty");

  // Never serialize env or argv: config arguments can contain credentials.
  const secrets = Object.entries(opts.env)
    .filter(([key, value]) => /token|secret|password|api_?key|authorization/i.test(key) && value && value.length >= 4)
    .map(([, value]) => value!).sort((a, b) => b.length - a.length);
  const redact = (text: string): string => secrets.reduce((result, secret) => result.split(secret).join("[REDACTED]"), text);
  writeFileSync(opts.logPath, "# Codex App Server goal protocol\n", "utf8");

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      cwd: opts.cwd, env: opts.env, stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    const pending = new Map<number, { method: string; receive: (result: ObjectValue) => void }>();
    let sequence = 0;
    let threadId: string | undefined;
    let activeTurn: string | undefined;
    let goalStatus: string | undefined;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let stopping = false;
    let finished = false;
    let requestedExit: number | undefined;
    let forceTimer: NodeJS.Timeout | undefined;
    const capture = (previous: string, next: string): string => (previous + next).slice(-CAPTURE_LIMIT);
    const log = (stream: string, line: string): void => {
      appendFileSync(opts.logPath, `[${stream}] ${redact(line)}\n`, "utf8");
    };
    const kill = (signal: NodeJS.Signals): void => {
      try {
        if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") child.kill(signal);
      }
    };
    const stop = (exitCode: number, reason?: string): void => {
      if (stopping) return;
      stopping = true;
      requestedExit = exitCode;
      clearTimeout(timer);
      if (reason) {
        const message = redact(reason);
        stderr = capture(stderr, `${message}\n`);
        try { log("runner", message); } catch { /* The result still carries log failures. */ }
      }
      child.stdin.end();
      kill("SIGTERM");
      forceTimer = setTimeout(() => kill("SIGKILL"), 1000);
    };
    const fail = (reason: string): void => stop(1, reason);
    const send = (message: ObjectValue): void => {
      if (stopping) return;
      child.stdin.write(`${JSON.stringify(message)}\n`);
    };
    const request = (method: string, params: ObjectValue, receive: (result: ObjectValue) => void): void => {
      if (stopping) return;
      const id = ++sequence;
      pending.set(id, { method, receive });
      send({ id, method, params });
    };
    const finishIfTerminal = (): void => {
      // A goal tool can report completion before its enclosing turn has ended.
      if (goalStatus && goalStatus !== "active" && !activeTurn) {
        stop(goalStatus === "complete" ? 0 : 1, goalStatus === "complete" ? undefined : `Codex goal stopped: ${goalStatus}`);
      }
    };
    const observeGoal = (value: unknown): void => {
      const goal = object(value);
      if (goal.threadId !== threadId || typeof goal.status !== "string" || !GOAL_STATUSES.has(goal.status)) {
        fail("Codex goal protocol returned an invalid goal or unknown status");
        return;
      }
      // A delayed get response must not erase a terminal update already observed.
      if (goalStatus && goalStatus !== "active" && goal.status === "active") return;
      goalStatus = goal.status;
      finishIfTerminal();
    };
    const timer = setTimeout(() => {
      timedOut = true;
      stop(124, `Codex goal timed out after ${opts.timeoutMs}ms`);
    }, opts.timeoutMs);

    const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
    lines.on("line", (line) => {
      try {
        log("stdout", line);
        stdout = capture(stdout, `${redact(line)}\n`);
        if (stopping || !line.trim()) return;
        const msg = object(JSON.parse(line));
        if (typeof msg.method === "string") {
          // Approval/input requests cannot silently hang an unattended run.
          if (msg.id !== undefined) {
            send({ id: msg.id, error: { code: -32601, message: "Unsupported unattended client request" } });
            fail(`Codex requested unsupported client interaction: ${msg.method}`);
            return;
          }
          const params = object(msg.params);
          if (!threadId || params.threadId !== threadId) return;
          if (msg.method === "thread/goal/updated") observeGoal(params.goal);
          else if (msg.method === "thread/goal/cleared") fail("Codex goal was cleared without a confirmed terminal status");
          else if (msg.method === "turn/started") {
            const id = object(params.turn).id;
            if (typeof id === "string") activeTurn = id;
          } else if (msg.method === "turn/completed") {
            const turn = object(params.turn);
            if (turn.id === activeTurn) activeTurn = undefined;
            finishIfTerminal();
            if (!stopping) request("thread/goal/get", { threadId }, (result) => {
              observeGoal(result.goal);
              if (!stopping && goalStatus === "active" && !activeTurn && ["failed", "interrupted"].includes(String(turn.status))) {
                fail(`Codex turn ${turn.status} before goal completion: ${String(object(turn.error).message ?? "no error detail")}`);
              }
            });
          } else if (msg.method === "error" && params.willRetry === false) {
            fail(`Codex error: ${String(object(params.error).message ?? "unrecoverable turn error")}`);
          }
          return;
        }
        if (typeof msg.id !== "number") throw new Error("Missing response id");
        const call = pending.get(msg.id);
        if (!call) return;
        pending.delete(msg.id);
        if (msg.error !== undefined) {
          fail(`Codex ${call.method} failed: ${String(object(msg.error).message ?? "RPC error")}`);
        } else if (msg.result === undefined) {
          fail(`Codex ${call.method} response has no result`);
        } else call.receive(object(msg.result));
      } catch (error) {
        fail(`Codex goal protocol/log error: ${(error as Error).message}`);
      }
    });
    lines.on("close", () => {
      if (!stopping) fail("Codex app-server stdout closed before goal completion");
    });
    const errors = createInterface({ input: child.stderr, crlfDelay: Infinity });
    errors.on("line", (line) => {
      stderr = capture(stderr, `${redact(line)}\n`);
      try { log("stderr", line); } catch (error) { fail(`Cannot write Codex goal log: ${(error as Error).message}`); }
    });
    child.stdin.on("error", (error) => { if (!stopping) fail(`Codex stdin failed: ${error.message}`); });
    child.on("error", (error) => fail(`Cannot start Codex app-server: ${error.message}`));
    child.on("close", (code, signal) => {
      if (finished) return;
      finished = true;
      // The server can exit before a descendant that ignores SIGTERM. Preserve
      // our cleanup guarantee even when that descendant has detached its stdio.
      if (stopping) kill("SIGKILL");
      clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      lines.close();
      errors.close();
      if (!stopping) {
        const message = `Codex app-server closed before goal completion (exit ${code}, signal ${signal})`;
        stderr = capture(stderr, `${message}\n`);
        try { log("runner", message); } catch { /* Preserve the process failure result. */ }
      }
      resolve({ exitCode: requestedExit ?? 1, stdout, stderr, timedOut, ...(goalStatus ? { goalStatus } : {}) });
    });
    request("initialize", {
      clientInfo: { name: "harness-swarm", version: "0.1.0" },
      capabilities: { experimentalApi: true },
    }, () => {
      send({ method: "initialized", params: {} });
      request("thread/start", {
        cwd: opts.cwd, ephemeral: false, approvalPolicy: "never", sandbox: "danger-full-access",
        ...(opts.model ? { model: opts.model } : {}),
        ...(opts.effort ? { config: { model_reasoning_effort: opts.effort } } : {}),
      }, (result) => {
        const id = object(result.thread).id;
        if (typeof id !== "string" || !id) { fail("Codex thread/start returned no thread id"); return; }
        threadId = id;
        request("thread/goal/set", {
          threadId, objective: opts.prompt,
          ...(opts.tokenBudget !== undefined ? { tokenBudget: opts.tokenBudget } : {}),
        }, (result) => observeGoal(result.goal));
      });
    });
  });
}
