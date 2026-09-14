import type { RunHarnessOptions } from "./dispatch.js";
import { HARNESS_NAMES, isHarnessName } from "./types.js";

const RUN_FIELDS = new Set([
  "name", "prompt", "repoRoot", "executable", "model", "maxTurns", "timeoutMs", "extraEnv",
  "effort", "goal", "tokenBudget", "maxBudgetUsd", "persistSession", "nativeArgs",
]);

function nonemptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "" || value.includes("\0")) {
    throw new Error(`${field} must be a nonempty string without NUL characters`);
  }
}

/** Validate input before repository lookup, directory creation, or harness startup. */
export function validateRunOptions(opts: RunHarnessOptions): void {
  if (opts === null || typeof opts !== "object" || Array.isArray(opts)) {
    throw new Error("run options must be an object");
  }
  for (const field of Object.keys(opts)) {
    if (!RUN_FIELDS.has(field)) throw new Error(`unknown run option: ${field}`);
  }
  if (typeof opts.name !== "string" || !isHarnessName(opts.name)) {
    throw new Error(`name must be ${HARNESS_NAMES.join("|")}`);
  }
  nonemptyString(opts.prompt, "prompt");
  for (const field of ["repoRoot", "executable", "model", "effort"] as const) {
    if (opts[field] !== undefined) nonemptyString(opts[field], field);
  }
  for (const field of ["maxTurns", "timeoutMs", "tokenBudget"] as const) {
    const value = opts[field];
    if (value === undefined) continue;
    const minimum = field === "maxTurns" && opts.name === "qoder" ? 0 : 1;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
      throw new Error(`${field} must be a finite ${minimum === 0 ? "nonnegative" : "positive"} safe integer`);
    }
  }
  if (opts.maxBudgetUsd !== undefined &&
      (typeof opts.maxBudgetUsd !== "number" || !Number.isFinite(opts.maxBudgetUsd) || opts.maxBudgetUsd <= 0)) {
    throw new Error("maxBudgetUsd must be a finite positive number");
  }
  if (opts.timeoutMs !== undefined && opts.timeoutMs > 2_147_483_647) {
    throw new Error("timeoutMs exceeds the maximum timer delay (2147483647 ms)");
  }
  for (const field of ["goal", "persistSession"] as const) {
    if (opts[field] !== undefined && typeof opts[field] !== "boolean") {
      throw new Error(`${field} must be a boolean`);
    }
  }
  if (opts.nativeArgs !== undefined &&
      (!Array.isArray(opts.nativeArgs) || opts.nativeArgs.some((arg) => typeof arg !== "string" || arg.includes("\0")))) {
    throw new Error("nativeArgs must be an array of strings without NUL characters");
  }
  if (opts.extraEnv !== undefined &&
      (opts.extraEnv === null || typeof opts.extraEnv !== "object" || Array.isArray(opts.extraEnv) ||
       Object.entries(opts.extraEnv).some(([key, value]) => key.includes("\0") || key.includes("=") ||
         typeof value !== "string" || value.includes("\0")))) {
    throw new Error("extraEnv must map valid environment names to strings without NUL characters");
  }
}

const CLI_FIELDS = {
  name: "name", prompt: "prompt", repo: "repoRoot", executable: "executable", model: "model",
  "max-turns": "maxTurns", "timeout-ms": "timeoutMs", effort: "effort", goal: "goal",
  "token-budget": "tokenBudget", "max-budget-usd": "maxBudgetUsd",
  "persist-session": "persistSession", "native-args": "nativeArgs",
} as const;

/** Parse the wrapper's flags only; after `--`, preserve each native argv element verbatim. */
export function parseRunFlags(argv: string[]): RunHarnessOptions | "help" {
  const values: Record<string, unknown> = {};
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--") {
      if (values.nativeArgs !== undefined) throw new Error("--native-args and -- cannot be combined");
      values.nativeArgs = argv.slice(i + 1);
      break;
    }
    if (token === "--help" || token === "-h") {
      help = true;
      continue;
    }
    if (!token.startsWith("--")) throw new Error(`unexpected argument: ${token}`);
    const equals = token.indexOf("=");
    const flag = token.slice(2, equals < 0 ? undefined : equals);
    if (!Object.hasOwn(CLI_FIELDS, flag)) throw new Error(`unknown option: --${flag}`);
    const field = CLI_FIELDS[flag as keyof typeof CLI_FIELDS];
    if (Object.hasOwn(values, field)) throw new Error(`duplicate option: --${flag}`);
    let value = equals < 0 ? undefined : token.slice(equals + 1);
    if (field === "goal" || field === "persistSession") {
      if (value === undefined && (argv[i + 1] === "true" || argv[i + 1] === "false")) value = argv[++i];
      if (value !== undefined && value !== "true" && value !== "false") {
        throw new Error(`--${flag} must be true or false`);
      }
      values[field] = value !== "false";
      continue;
    }
    if (value === undefined) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error(`--${flag} requires a value; use --prompt=... when the prompt starts with --`);
      }
      value = next;
      i += 1;
    }
    if (["maxTurns", "timeoutMs", "tokenBudget", "maxBudgetUsd"].includes(field)) {
      values[field] = value.trim() === "" ? Number.NaN : Number(value);
    } else if (field === "nativeArgs") {
      try {
        values[field] = JSON.parse(value) as unknown;
      } catch {
        throw new Error("--native-args must be a JSON string array");
      }
    } else {
      values[field] = value;
    }
  }
  if (help) return "help";
  // The validator is the runtime boundary for CLI and MCP input; no string coercion is used.
  const options = values as unknown as RunHarnessOptions;
  validateRunOptions(options);
  return options;
}
