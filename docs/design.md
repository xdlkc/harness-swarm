# Harness Swarm MVP Design

Codex plugin that lets a Codex session dispatch one coding harness at a time.

Agreed contract:

- Distribution: Codex plugin (Skill + MCP), Agent Plugins 1.0 plus `.codex-plugin` overlay.
- Orchestrator: Codex. Humans keep goals and merge authority.
- Dispatch: synchronous, one harness per call.
- Harnesses: `qoder` (`qodercli`), `kimi`, `pi`, `grok`.
- Isolation: independent git worktree per run. The source checkout is never merge-updated by the runner.
- Return: evidence only (exit code, summary, diff/stat, worktree path, base/head sha). No auto-merge, no PR, no failover cascade.
- CLI flags: harness-specific headless recipes, not a single `-p` for every binary.

Non-goals: quota routing, parallel fan-out, Tailscale, wrapping CLIs as `.codex/agents/*.toml`, live 20-minute paid CLI jobs as the test gate.

## Layers

```
human → Codex session
          ├─ Skill  dispatch-harness   when to dispatch, how to write a brief, how to read evidence
          └─ MCP    harness-swarm      list_harnesses / run_harness
                    ├─ command builder (pure argv/env/cwd)
                    └─ worktree runner (add → spawn → collect → never merge)
```

The plugin is installed once and operates on **the git repository Codex currently has open**, not on this plugin repo.

## MCP tools

### `list_harnesses`

Reports the four names. For each binary found on `PATH`, include path and a non-empty version string. Missing binaries stay listed with `installed: false`.

### `run_harness`

Required: `name` (`qoder` | `kimi` | `pi` | `grok`), `prompt`.

Optional: `model`, `max_turns` (honored only if that CLI has the flag), `timeout_ms` (default 1200000).

`name` is required at the tool boundary. The Skill may choose a name when the user did not; the server never silently substitutes another harness if the named binary is missing.

## Worktree runner

1. Resolve the target repo (`git rev-parse --show-toplevel` from the process cwd unless overridden).
2. Allocate `run_id`, branch `harness/<name>/<run_id>`, worktree `<repo>/.harness-swarm/worktrees/<run_id>`.
3. `git worktree add -b <branch> <worktree>`.
4. Write `brief.md` under `<repo>/.harness-swarm/runs/<run_id>/`.
5. Build argv via the command builder; spawn with the builder's `cwd`/`env`; bound by timeout.
6. Capture stdout/stderr to `run.log`. After exit, `git -C worktree rev-parse HEAD`, `git diff --stat` and `git diff` against `base_sha`.
7. Return evidence JSON. Do not `git merge`, `git pull`, or check the worktree branch out in the source tree.

## Command recipes (local versions used for research)

qodercli 0.1.20, kimi 0.41.0, pi 0.84.1, grok 1.0.13.

Worktrees are **ours**. Do not pass qoder `--worktree` (concurrent jobs) or grok `--worktree` (ignored / not created under `-p`).

### qoder

- Workspace: `-w <worktree>`
- Headless: `-p <brief text>`
- Output: `-f json`
- Permissions: `--yolo`
- Quiet: `--quiet`
- Turns: `--max-turns N` when provided
- Model: `--model` when provided (`auto` | `efficient` | `lite` | `performance` | `ultimate`)

### kimi

- Working directory: process `cwd` = worktree (this kimi-code build has no `-w` / `--work-dir`)
- Headless: `-p <brief text>`
- Output: `--output-format stream-json`
- Permissions: `-p` already uses auto; **do not** add `--yolo`, `--auto`, or `--plan` (startup rejects the combination)
- Isolation: `KIMI_CODE_HOME=<runDir>/kimi-home`
- Model: `-m` when provided

### pi

- Working directory: process `cwd` = worktree
- Headless: `-p` plus `--mode json`
- Brief: `@<brief.md>` plus a short execute instruction
- Project trust: `--approve` (AGENTS.md trust, not a yolo alias)
- Avoid hangs: `--exclude-tools ask_question`
- Session: `--session-dir <runDir>/pi-sessions` `--name harness-<run_id>`
- Model: `--model` when provided

### grok

- Working directory: `--cwd <worktree>`
- Headless: `--prompt-file <brief.md>` (not only `-p`)
- Output: `--output-format json`
- Permissions: `--always-approve` (this build has no `--yolo` in `--help`)
- Turns: `--max-turns N` when provided
- Extra: `--no-subagents --verbatim`
- **Do not** pass `--worktree` together with headless `-p` / `--prompt-file`

## Evidence

```
run_id, harness, worktree, branch,
base_sha, head_sha, exit_code, timed_out,
summary, diff_stat, diff_path, log_path,
started_at, finished_at, argv, notes
```

Large diffs are written to `diff.patch` in the run directory; the tool result includes stat plus that path.

## Skill policy

User-named harness wins if installed. If unnamed, Codex may pick from the skill preference table (frontend → kimi, grok-native → grok, mechanical → pi, default implementation → qoder). If the chosen binary is missing, fail and list what is installed. No cascade.

## Tests

Command-builder tests call the shipped builder (not a reimplementation) and assert argv contents above.

Dispatch tests use stub binaries that record argv and write a file in cwd. They assert a worktree/branch exists, evidence fields are present, and the original checkout branch/commit is unchanged (no merge).
