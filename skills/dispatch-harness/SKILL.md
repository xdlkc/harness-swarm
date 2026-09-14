---
name: dispatch-harness
description: Dispatch a coding task to qodercli, kimi, pi, grok, codex, Claude Code, dsh, or opencode via the harness-swarm MCP. Use when the user wants another CLI harness to implement, explore, or edit in an isolated git worktree.
---

# Dispatch harness

Use the MCP tools to run a coding task in an isolated Git worktree and return evidence. Each call runs one harness synchronously. The runner never merges; follow the user's existing scope and integration authorization when deciding subsequent work.

## Tools and target

- `list_harnesses`: all eight names, PATH installation status, versions, and `capabilities`. Installation is not proof of valid authentication or provider access.
- `run_harness`: required `name`, nonempty `prompt`, and absolute `repo_root`. Pass the Git repository open in the user's session, not the plugin/MCP process cwd. The plugin starts in its own installation directory.

Honor a user-named harness. Claude Code maps to `claude`; DeepSeek Harness maps to `dsh`. If unnamed, the default preferences are frontend UI → kimi, grok/xAI work → grok, small mechanical edits → pi, otherwise qoder. Report missing binaries or actual authentication errors; do not silently cascade to another harness.

Write the brief with the objective, file ownership, required checks, and concrete completion criteria. Wait for the synchronous evidence result.

## Structured task options

Use MCP fields, not guessed raw CLI flags:

| Field | Supported mapping |
| --- | --- |
| `model` | All except dsh; DSH uses its profile model |
| `effort` | pi→thinking, grok→reasoning-effort, codex→model_reasoning_effort, claude→effort, opencode→variant |
| `max_turns` | qoder (0 permitted), grok/claude (positive integer) |
| `goal` | kimi/grok/claude native Goal prompt; codex App Server Goal protocol |
| `token_budget` | codex/grok only with goal=true; claude task-budget also works without Goal |
| `max_budget_usd` | claude only; finite positive number |
| `persist_session` | codex/claude/pi only |
| `timeout_ms` | Runner deadline, positive integer milliseconds; default 1200000 |
| `native_args` | Array of native task-entry argv strings, subject to reserved/conflict validation |

Unknown fields, incorrect types, empty prompts, unsupported capabilities and conflicting arguments are errors; they are not silently ignored. Inspect capabilities and the relevant `docs/<harness>/README.md` before selecting advanced options.

`native_args` extends the existing task entrypoint. It does not execute native management subcommands such as auth/mcp/upgrade, or Codex exec resume. Do not override runner-owned prompt, worktree, output format or execution transport. Do not duplicate a structured option in native_args. Explicit supported native permission modes replace the corresponding default bypass flags; Kimi print mode still rejects yolo/auto/plan.

Known task options consume the value counts recorded in `src/native-args.ts`, so `--option value` is supported for those flags. Unknown/extension flags with values must use `--flag=value`. Reject free positional tokens after boolean flags, such as `--strict-config review`; they must not select a subcommand.

Examples: Claude `native_args: ["--append-system-prompt", "Additional instructions"]`; OpenCode `["--agent", "build"]`; DSH `["--patch", "/absolute/path/to/overlay.yml"]`. Codex Goal restricts native_args to config/enable/disable/strict-config and cannot disable goals.

## Goal and session boundaries

For `goal=true`, prompt contains the objective only; do not prefix `/goal` or supply management actions. Claude/Kimi/Codex objectives are limited to 4000 characters. Grok Goal uses streaming-json without disabling internal subagents by default; Claude Goal uses stream-json with verbose. Grok token budgets become the native Goal command's `--budget`; Claude task budget is distinct from a goal and from a USD limit.

Codex Goal starts a persistent thread and uses `thread/goal/set`; persist_session=false is invalid. Codex protocol state and Kimi native `goal.summary` state are exposed as `goal_status`. Kimi without a complete event fails even if its process exits 0. Claude/Grok use streaming output for verdict inspection; a successful process exit or confident prose alone is not a confirmed completed goal.

Codex/Claude ordinary runs default to nonpersistent sessions; Pi saves its session in the run directory unless explicitly disabled. Native resume/continue flags restore harness history only. Every swarm call creates a fresh worktree; session persistence does not restore an old code directory. Codex native resume/fork subcommands are outside the supported task-entry passthrough.

The recorded live Goal checks confirm complete for Codex and Kimi. Claude streaming completed Write→Read in 54.288 seconds (exit 0, no timeout), but exposed no goal-status/met event; ordinary completed does not prove Goal met. Grok streaming reached an independent review and produced 738 NDJSON events, but timed out at 150.399 seconds (exit 124) while still active/phaseExecuting after one worker round. It started a native Goal without an authentication error, but completion was not verified.

Kimi inherits its existing home, model configuration and authentication. Do not replace KIMI_CODE_HOME with an empty run directory.

## Evidence

Durable argv evidence and the log command header redact recognized credential keys and credential-bearing argument payloads. Native stdout/stderr remains raw; do not describe this as full log sanitization.

Read `exit_code`, `timed_out`, `summary`, `diff_stat` / `diff_path`, `worktree`, `base_sha`, `head_sha`, `notes`, and `goal_status` when present. Inspect the actual changes and run the checks needed by the task; do not equate a model's wording with completion. Report concrete blockers and preserve completed evidence. Merge only within the user's authorization; the runner itself performs no merge.
