---
name: dispatch-harness
description: Dispatch a coding task to qodercli, kimi, pi, or grok via the harness-swarm MCP. Use when the user wants another CLI harness to implement, explore, or edit in an isolated git worktree.
---

# Dispatch harness

You are the orchestrator. Humans keep goals and merge authority. Call MCP tools; do not shell out to `qodercli`/`kimi`/`pi`/`grok` yourself.

## Tools

- `list_harnesses` — path + version for qoder, kimi, pi, grok when installed.
- `run_harness` — required `name` and `prompt`. Creates a git worktree, runs that harness headlessly, returns evidence. Never merges.

## Choosing `name`

1. If the user named a harness, use that name if `list_harnesses` shows it installed.
2. If unnamed, pick from this table: frontend UI → kimi; grok/xAI native work → grok; mechanical small edits → pi; otherwise qoder.
3. If the chosen binary is missing, stop and report installed harnesses. Do not cascade to another harness.

## Brief

Write a complete prompt: goal, file ownership, test command, definition of done. `run_harness` is synchronous; wait for evidence.

## Evidence

Done is not the model's tone. Read `exit_code`, `summary`, `diff_stat` / `diff_path`, `worktree`, `base_sha`, `head_sha`. The source checkout is unchanged. Propose a merge only after the human agrees. Do not merge yourself unless the human explicitly asks.

## Flags (do not re-invent)

The server already applies harness-specific headless flags (qoder `-w -f json --yolo`; kimi `-p` stream-json without `--yolo/--auto/--plan`; pi `--mode json` `@brief` `--approve`; grok `--cwd --prompt-file --always-approve`, no `--worktree` with headless). Pass `model` / `max_turns` only as tool arguments.
