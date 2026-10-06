#!/usr/bin/env node
import { HARNESS_NAMES, isHarnessName, type HarnessName } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness, runSession } from "./dispatch.js";
import { parseRunFlags } from "./options.js";
import { listAllSessions, listSessions, searchAllSessions, searchSessions, type SessionRecord } from "./sessions.js";
import { linkRules, rulesStatus, unlinkRules } from "./global-rules.js";
import {
  hasSelection, installCandidates, installSkills, listSkills, selectionFromKeys, uninstallCandidates, uninstallSkills, type SkillsOpts,
} from "./global-skills.js";
import { pickMany } from "./picker.js";

const HELP = `Usage: hs [list | run [options] | sessions <...> | rules <...> | skills <...>]

Commands:
  list                            List installed harnesses and versions (default)
  run                             Run a task in an isolated git worktree
  sessions list|search|resume|fork  Query or continue native session history
  rules status|link|unlink        Symlink the built-in global rules file into each harness
  skills list|install|update|uninstall  Symlink the built-in skill list into each harness

Rules and skills options:
  rules [status|link|unlink] [--name <name>]... [--force] [--dry-run]
  skills [list|install|update|uninstall] [--name <name>]... [selection] [--force] [--dry-run]
    --name <name>          Harness to target (repeatable or comma-separated); default: every
                           supported harness whose config dir exists (dsh is not supported)
    --skill <pattern>      Skills by name; * and ? are wildcards (repeatable or comma-separated)
    --repo <repo>          Every skill of a manifest repo, or "local" for bundled skills (repeatable)
    --all                  Every skill in the built-in list
    --force                Move conflicting files/links to <path>.hs-backup-<time>, then link
    --dry-run              Report planned actions without changing files or fetching repos
    install/uninstall without a selection open an interactive multi-select in a terminal and
    fail otherwise. Only repos behind the selection are cloned. update refreshes the selected
    repos; without a selection it updates the skills hs already installed.
    unlink/uninstall remove only links created by hs.

Sessions options:
  sessions list [--name <name>] [--cwd <dir>] [--limit <n>]
  sessions search <query> [--name <name>] [--cwd <dir>] [--limit <n>]
  sessions resume|fork --name <name> --session <id> --prompt <text> [--repo <path>] [--model <m>] [--timeout-ms <n>]
    --name <name>          ${HARNESS_NAMES.join(" | ")}
    --cwd <dir>            Only sessions whose working directory starts with this (list/search)
    --limit <n>            Maximum number of records (default: 50; list/search)
    --session <id>         Native session id/title/path to resume or fork
    --prompt <text>        Task text to send after resuming/forking the session

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

type SessionsArgs =
  | { kind: "help" }
  | { kind: "list"; name?: HarnessName; limit?: number; cwd?: string }
  | { kind: "search"; query: string; name?: HarnessName; limit?: number; cwd?: string }
  | { kind: "resume" | "fork"; name: HarnessName; session: string; prompt: string; repo?: string; model?: string; executable?: string; timeoutMs?: number };

function parseSessionsArgs(argv: string[]): SessionsArgs {
  if (argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") return { kind: "help" };
  const sub = argv[0];
  if (sub === "list" || sub === "search") return parseListSearch(sub, argv.slice(1));
  if (sub === "resume" || sub === "fork") return parseResumeFork(sub, argv.slice(1));
  throw new Error(`unknown sessions command: ${sub ?? "(none)"}`);
}

function parseListSearch(sub: "list" | "search", argv: string[]): SessionsArgs {
  let name: HarnessName | undefined;
  let limit: number | undefined;
  let cwd: string | undefined;
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") return { kind: "help" };
    const eq = token.indexOf("=");
    const flag = token.slice(0, eq < 0 ? undefined : eq);
    const inline = eq < 0 ? undefined : token.slice(eq + 1);
    const take = (): string => {
      if (inline !== undefined) return inline;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) throw new Error(`${flag} requires a value`);
      i += 1;
      return next;
    };
    if (flag === "--name") {
      const value = take();
      if (!isHarnessName(value)) throw new Error(`name must be ${HARNESS_NAMES.join("|")}`);
      name = value;
    } else if (flag === "--limit") {
      const value = Number(take());
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error("--limit must be a positive safe integer");
      limit = value;
    } else if (flag === "--cwd") {
      cwd = take();
    } else if (token.startsWith("-")) {
      throw new Error(`unknown option: ${token}`);
    } else {
      positional.push(token);
    }
  }
  if (sub === "search") {
    const query = positional.join(" ");
    if (query.trim() === "") throw new Error("search requires a query");
    return { kind: "search", query, name, limit, cwd };
  }
  if (positional.length !== 0) throw new Error(`unexpected argument for sessions list: ${positional[0]}`);
  return { kind: "list", name, limit, cwd };
}

function parseResumeFork(sub: "resume" | "fork", argv: string[]): SessionsArgs {
  let name: HarnessName | undefined;
  let session: string | undefined;
  let prompt: string | undefined;
  let repo: string | undefined;
  let model: string | undefined;
  let executable: string | undefined;
  let timeoutMs: number | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") return { kind: "help" };
    const eq = token.indexOf("=");
    const flag = token.slice(0, eq < 0 ? undefined : eq);
    const inline = eq < 0 ? undefined : token.slice(eq + 1);
    const take = (): string => {
      if (inline !== undefined) return inline;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) throw new Error(`${flag} requires a value`);
      i += 1;
      return next;
    };
    if (flag === "--name") {
      const value = take();
      if (!isHarnessName(value)) throw new Error(`name must be ${HARNESS_NAMES.join("|")}`);
      name = value;
    } else if (flag === "--session") {
      session = take();
    } else if (flag === "--prompt") {
      prompt = take();
    } else if (flag === "--repo") {
      repo = take();
    } else if (flag === "--model") {
      model = take();
    } else if (flag === "--executable") {
      executable = take();
    } else if (flag === "--timeout-ms") {
      const value = Number(take());
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error("--timeout-ms must be a positive safe integer");
      timeoutMs = value;
    } else if (token.startsWith("-")) {
      throw new Error(`unknown option: ${token}`);
    } else {
      throw new Error(`unexpected argument: ${token}`);
    }
  }
  if (name === undefined) throw new Error("--name is required");
  if (session === undefined || session.trim() === "") throw new Error("--session is required");
  if (prompt === undefined || prompt.trim() === "") throw new Error("--prompt is required; use --prompt=... if it starts with --");
  return { kind: sub, name, session, prompt, repo, model, executable, timeoutMs };
}

interface AssetArgs {
  sub: string;
  names: HarnessName[];
  skills: string[];
  repos: string[];
  all: boolean;
  force: boolean;
  dryRun: boolean;
}

function parseAssetArgs(command: "rules" | "skills", subs: string[], argv: string[]): AssetArgs | "help" {
  const args: AssetArgs = { sub: subs[0], names: [], skills: [], repos: [], all: false, force: false, dryRun: false };
  let i = 0;
  if (argv[0] !== undefined && !argv[0].startsWith("-")) {
    if (argv[0] === "help") return "help";
    if (!subs.includes(argv[0])) throw new Error(`unknown ${command} command: ${argv[0]}`);
    args.sub = argv[0];
    i = 1;
  }
  for (; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") return "help";
    const eq = token.indexOf("=");
    const flag = token.slice(0, eq < 0 ? undefined : eq);
    const inline = eq < 0 ? undefined : token.slice(eq + 1);
    const take = (): string[] => {
      let value = inline;
      if (value === undefined) {
        value = argv[i + 1];
        if (value === undefined || value.startsWith("--")) throw new Error(`${flag} requires a value`);
        i += 1;
      }
      return value.split(",").map((v) => v.trim()).filter((v) => v !== "");
    };
    if (flag === "--name") {
      for (const value of take()) {
        if (!isHarnessName(value)) throw new Error(`name must be ${HARNESS_NAMES.join("|")}`);
        args.names.push(value);
      }
    } else if (flag === "--skill" && command === "skills") {
      args.skills.push(...take());
    } else if (flag === "--repo" && command === "skills") {
      args.repos.push(...take());
    } else if (token === "--all" && command === "skills") {
      args.all = true;
    } else if (token === "--force") {
      args.force = true;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token.startsWith("-")) {
      throw new Error(`unknown option: ${token}`);
    } else {
      throw new Error(`unexpected argument: ${token}`);
    }
  }
  return args;
}

function filterByCwd(records: SessionRecord[], cwd: string): SessionRecord[] {
  return records.filter((r) => r.cwd !== undefined && r.cwd.startsWith(cwd));
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
  if (cmd === "sessions") {
    const parsed = parseSessionsArgs(rest);
    if (parsed.kind === "help") {
      process.stdout.write(HELP);
      return;
    }
    if (parsed.kind === "list" || parsed.kind === "search") {
      const opts = { limit: parsed.limit };
      let records: SessionRecord[];
      if (parsed.name === undefined) {
        records = parsed.kind === "search" ? searchAllSessions(parsed.query, opts) : listAllSessions(opts);
      } else {
        records = parsed.kind === "search"
          ? searchSessions(parsed.name, parsed.query, opts)
          : listSessions(parsed.name, opts);
      }
      if (parsed.cwd !== undefined) records = filterByCwd(records, parsed.cwd);
      printJson(records);
      return;
    }
    const evidence = await runSession({
      name: parsed.name, action: parsed.kind, sessionId: parsed.session, prompt: parsed.prompt,
      repoRoot: parsed.repo, model: parsed.model, executable: parsed.executable, timeoutMs: parsed.timeoutMs,
    });
    printJson(evidence);
    if (evidence.exit_code !== 0 || evidence.timed_out) process.exitCode = 1;
    return;
  }
  if (cmd === "rules") {
    const parsed = parseAssetArgs("rules", ["status", "link", "unlink"], rest);
    if (parsed === "help") {
      process.stdout.write(HELP);
      return;
    }
    const opts = { names: parsed.names, force: parsed.force, dryRun: parsed.dryRun };
    const result = parsed.sub === "link" ? linkRules(opts) : parsed.sub === "unlink" ? unlinkRules(opts) : rulesStatus(opts);
    printJson(result);
    if (result.entries.some((e) => e.action === "skip")) process.exitCode = 1;
    return;
  }
  if (cmd === "skills") {
    const parsed = parseAssetArgs("skills", ["list", "install", "update", "uninstall"], rest);
    if (parsed === "help") {
      process.stdout.write(HELP);
      return;
    }
    let opts: SkillsOpts = {
      names: parsed.names, skills: parsed.skills, repos: parsed.repos, all: parsed.all, force: parsed.force, dryRun: parsed.dryRun,
    };
    if (parsed.sub === "list") {
      const result = listSkills(opts);
      printJson(result);
      if (result.errors.length) process.exitCode = 1;
      return;
    }
    // install and uninstall never default to everything: without a selection, pick interactively.
    if ((parsed.sub === "install" || parsed.sub === "uninstall") && !hasSelection(opts) && process.stdin.isTTY && process.stderr.isTTY) {
      const items = parsed.sub === "install" ? installCandidates(opts) : uninstallCandidates(opts);
      if (items.length === 0) throw new Error(parsed.sub === "install" ? "no skills in the built-in list" : "no skills installed by hs");
      const keys = await pickMany(parsed.sub === "install" ? "Install skills" : "Uninstall skills", items);
      if (keys === null) {
        process.stderr.write("cancelled\n");
        process.exitCode = 1;
        return;
      }
      if (keys.length === 0) {
        process.stderr.write("no skills selected\n");
        return;
      }
      opts = { ...opts, ...selectionFromKeys(keys) };
    }
    if (parsed.sub === "uninstall") {
      printJson(uninstallSkills(opts));
      return;
    }
    const result = installSkills(opts, parsed.sub === "update");
    printJson(result);
    if (result.errors.length || result.links.some((l) => l.action === "skip")) process.exitCode = 1;
    return;
  }
  throw new Error(`unknown command: ${cmd}`);
}

main(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
