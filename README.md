# Harness Swarm

English | [简体中文](./README.zh-CN.md)

**Harness Swarm (`hs`)** is a CLI and Codex plugin (Skill + MCP server) that dispatches coding agent harnesses into isolated Git worktrees and returns structured logs, exit status, and diff evidence. Each invocation runs one harness and never auto-merges.

- **Nine supported harnesses**: Unified structured options plus strict `native_args` passthrough for `qoder`, `kimi`, `pi`, `grok`, `codex`, `claude`, `dsh`, `opencode`, and `opencode2`.
- **Cross-harness session history**: Query metadata across native session stores (`hs sessions list` / `search`) and continue or branch past conversations inside fresh Git worktrees (`resume` / `fork`).
- **Unified global rules & skills**: Symlink one canonical `AGENTS.md` and curated Skill repositories across all installed harness config directories (`hs rules` / `hs skills`).

## Supported Harnesses

The table below lists **harness-swarm structured fields** (not the full native CLI surface; pass additional task flags via `native_args`):

| Harness | Snapshot Version | `model` | `effort` | `max_turns` | `goal` | `token_budget` | `max_budget_usd` | `persist_session` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [qoder](./docs/qoder/README.md) | 0.1.20 | ✓ | — | ≥0 | — | — | — | — |
| [kimi](./docs/kimi/README.md) | 0.41.0 | ✓ | — | — | ✓ | — | — | — |
| [pi](./docs/pi/README.md) | 0.84.1 | ✓ | ✓ | — | — | — | — | ✓ |
| [grok](./docs/grok/README.md) | 1.0.13 | ✓ | ✓ | ≥1 | ✓ | Goal | — | — |
| [codex](./docs/codex/README.md) | 0.154.0 | ✓ | ✓ | — | ✓ | Goal | — | ✓ |
| [claude](./docs/claude/README.md) | 2.1.177 | ✓ | ✓ | ≥1 | ✓ | Task | ✓ | ✓ |
| [dsh](./docs/dsh/README.md) | 0.1.1-rc.2 | profile | — | — | — | — | — | — |
| [opencode](./docs/opencode/README.md) | 1.18.21 | ✓ | ✓ | — | — | — | — | — |
| [opencode2](./docs/opencode2/README.md) | 0.0.0-beta | ✓ | — | — | — | — | — | — |

All harnesses support `native_args` and runner `timeout_ms`. `Goal` budgets require `goal=true`; Claude's `Task` budget does not. `dsh` selects models via its profile configuration and rejects `--model`. Full native CLI references live under [`docs/`](./docs/design.md).

## Quick Start

Install and link the standalone `hs` CLI (or invoke via `npm run cli -- <args>`):

```bash
npm install
npm link
hs --help
hs list
```

`hs list` / MCP `list_harnesses` reports binary paths, versions, and declared `capabilities` without probing live logins or model quotas.

```bash
# Claude: Goal mode, reasoning effort, USD cap, persistent session
hs run --name claude --repo /absolute/path/to/project \
  --goal --prompt "Fix failing unit tests until all pass" \
  --effort high --max-budget-usd 2 --persist-session

# Codex: Native App Server Goal protocol with token budget
hs run --name codex --repo /absolute/path/to/project \
  --goal --prompt "Fix failing unit tests until all pass" --token-budget 20000

# OpenCode: Pass native task flags after --
hs run --name opencode --repo /absolute/path/to/project \
  --prompt "Complete the requested refactor" -- --agent build

# DSH: Overlay a config patch on the headless profile
hs run --name dsh --repo /absolute/path/to/project \
  --prompt "Complete the requested refactor" \
  --native-args '["--patch","/absolute/path/to/overlay.yml"]'
```

CLI flags use kebab-case (`--max-turns`, `--token-budget`), while MCP tools use snake_case (`max_turns`, `token_budget`). Unsupported fields, invalid numbers, empty prompts, duplicate flags, or attempts to smuggle subcommands (`auth`, `mcp`, `upgrade`, `exec resume`) through `native_args` fail fast instead of being silently ignored.

## Session History (`hs sessions`)

List and search metadata across native session stores without loading full transcripts, and resume or fork sessions in fresh worktrees:

```bash
hs sessions list
hs sessions list --name codex --limit 20
hs sessions search "refactor" --cwd /absolute/path/to/project
hs sessions resume --name claude --session <id> --prompt "Continue fixing tests" --repo /abs/path
hs sessions fork   --name opencode2 --session <id> --prompt "Try an alternative approach" --repo /abs/path
```

| Harness | Data Source | Search Fields | `resume` | `fork` |
| --- | --- | --- | --- | --- |
| `qoder` | `~/.qoder/projects/*/<uuid>-session.json` | `title` | ✓ | — |
| `kimi` | `~/.kimi-code/session_index.jsonl` + `state.json` | `title` / `lastPrompt` | ✓ | — |
| `pi` | `~/.pi/agent/sessions/*/*.jsonl` (first line) | `cwd` + first user prompt | ✓ | ✓ |
| `grok` | `~/.grok/sessions/*/*/summary.json` | `title` / `summary` | ✓ | ✓ |
| `codex` | `~/.codex/session_index.jsonl` | `thread_name` | ✓ | ✓ |
| `claude` | `~/.claude/projects/*/sessions-index.json` | `summary` / `firstPrompt` | ✓ | ✓ |
| `opencode2` | `opencode2 api v2.session.list` | Native `search` parameter | ✓ | ✓ |

## Global Rules & Skills (`hs rules` / `hs skills`)

Symlink [`assets/rules/AGENTS.md`](./assets/rules/AGENTS.md) and Skills declared in [`assets/skills.json`](./assets/skills.json) (or local `assets/skills/<name>/SKILL.md`) into each harness's user config directory (`~/.codex/`, `~/.claude/`, `~/.qoder/`, `~/.kimi-code/`, `~/.pi/agent/`, `~/.grok/`, `~/.config/opencode/`):

```bash
hs rules                          # Inspect symlink status across harnesses
hs rules link --dry-run           # Preview changes
hs rules link --force             # Back up existing files before symlinking
hs rules unlink                   # Remove symlinks created by hs

hs skills list                    # Show skill manifest and install status
hs skills install                 # Interactive terminal multi-select picker
hs skills install --skill 'grill-me'
hs skills install --all --name claude,codex
hs skills update                  # Update cloned skill repos and sync symlinks
hs skills uninstall
```

Existing regular files or foreign symlinks are reported as `conflict` and skipped unless `--force` is passed.

## Goal Execution, Evidence & Codex Plugin

- **Goal mode**: Pass `--goal` with the objective text (do not prepend `/goal`). Codex uses its App Server `thread/goal/set` protocol; Kimi, Claude, and Grok use native Goal entry points with explicit verdict/status checks. See [`docs/design.md`](./docs/design.md) for verification records.
- **Evidence & redaction**: Each run returns `exit_code`, `timed_out`, `summary`, redacted `argv`, log path, diff path, worktree path, base/head SHAs, `notes`, and `native_session_id` (where supported). Credential flags and payloads in `argv` and command headers are replaced with `[REDACTED]`.
- **Codex Plugin**: Register this directory as a local Codex plugin ([`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json), [`mcp.json`](./mcp.json)). The MCP server starts from the plugin root; pass an absolute `repo_root` when invoking `run_harness`.

## Architecture

```text
harness-swarm/
├── package.json                # Node/TypeScript package manifest (bin: hs, MIT)
├── .codex-plugin/plugin.json   # Codex plugin manifest
├── mcp.json                    # MCP server definition
├── bin/harness-swarm-mcp       # MCP stdio launcher
├── assets/
│   ├── rules/AGENTS.md         # Canonical global rules source
│   └── skills.json             # External Skill repository manifest
├── skills/dispatch-harness/    # Codex dispatch skill
├── docs/                       # Design notes and per-harness CLI references
├── src/                        # CLI, dispatcher, command builder, sessions, MCP & symlink managers
└── test/                       # Unit and integration tests
```

## Verification

```bash
npm test
```

## License

Licensed under the **MIT** license (declared in [`package.json`](./package.json)).
