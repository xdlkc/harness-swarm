# Harness Swarm

Codex plugin (Skill + MCP) that dispatches **qodercli**, **kimi**, **pi**, and **grok** one at a time into an independent git worktree and returns evidence. It does not merge.

See [docs/design.md](docs/design.md).

## Commands

```bash
npm install
npm test
node dist/src/cli.js list
```

`run` (uses a real harness; not required for CI):

```bash
node dist/src/cli.js run --name pi --prompt "Summarize this repo in one paragraph" --repo /absolute/path/to/project
```

## Codex plugin

Install from this folder as a local plugin. MCP `cwd` is `"."` (plugin root). Tools: `list_harnesses`, `run_harness`. `run_harness` requires `repo_root` as the absolute path of the git repo Codex has open.
