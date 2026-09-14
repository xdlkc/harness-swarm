#!/usr/bin/env node
import { HARNESS_NAMES } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness } from "./dispatch.js";
import { parseRunFlags } from "./options.js";

const HELP = `Usage: harness-swarm [list | run [options]]

Commands:
  list                     List installed harnesses and versions (default)
  run                      Run a task in an isolated git worktree

Run options:
  --name <name>            ${HARNESS_NAMES.join(" | ")}
  --prompt <text>          Required task text; use --prompt=... if it starts with --
  --repo <path>            Target repository (defaults to the open workspace/cwd)
  --executable <path>      Override the harness executable
  --model <model>          Harness model identifier
  --max-turns <integer>    Turn limit (0 is allowed only for qoder)
  --timeout-ms <integer>   Runner timeout in milliseconds (default: 1200000)
  --effort <effort>        Harness reasoning effort
  --goal[=true|false]      Enable native goal execution when supported
  --token-budget <integer> Native token budget when supported
  --max-budget-usd <num>   Native USD budget when supported
  --persist-session[=true|false]  Keep the native session when supported
  --native-args <json>     JSON array of native argv strings
  -- <args...>            Native argv strings, instead of --native-args
  -h, --help              Print this help

Options depend on harness capabilities; unsupported combinations are errors.
Native arguments preserve array boundaries and are checked for conflicts with
wrapper-managed arguments. No shell expansion is performed.
`;

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    if (rest.length !== 0) throw new Error(`unexpected argument: ${rest[0]}`);
    process.stdout.write(HELP);
    return;
  }
  if (cmd === "list" || cmd === undefined) {
    if (rest.length === 1 && (rest[0] === "--help" || rest[0] === "-h")) {
      process.stdout.write(HELP);
      return;
    }
    if (rest.length !== 0) throw new Error(`unexpected argument for list: ${rest[0]}`);
    printJson(listHarnesses());
    return;
  }
  if (cmd === "run") {
    const options = parseRunFlags(rest);
    if (options === "help") {
      process.stdout.write(HELP);
      return;
    }
    const evidence = await runHarness(options);
    printJson(evidence);
    if (evidence.exit_code !== 0 || evidence.timed_out) process.exitCode = 1;
    return;
  }
  throw new Error(`unknown command: ${cmd}`);
}

main(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
