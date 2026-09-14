# Dispatch / adapter surface review

Historical review of the original four-harness MVP. Current capabilities and verification are recorded in [design.md](design.md); the findings below are not the current release status.

Review scope: `docs/design.md`, `src/build-command.ts`, `src/dispatch.ts`, `src/list-harnesses.ts`, `src/cli.ts`, `src/mcp.ts`, and `test/*.ts`, checked against the agreed harness-swarm contract.

Verification performed: read sources and tests; `npm test` (7/7 pass); exercised shipped `buildCommand` for all four harnesses; ran shipped `listHarnesses()` against the live PATH (qoder 0.1.20, kimi 0.41.0, pi 0.84.1, grok 1.0.13).

## Blocking issues

None.

The shipped surface matches the contract:

- Codex plugin shape is present (Skill `skills/dispatch-harness` + MCP via `mcp.json` / `bin/harness-swarm-mcp`); dispatch is synchronous and one named harness per call (`qoder` | `kimi` | `pi` | `grok`).
- `runHarness` creates an independent git worktree under `.harness-swarm/worktrees/<run_id>`, returns evidence only, and never merges, checks out, or fast-forwards the original checkout (asserted in `test/dispatch.test.ts`).
- Command builder recipes match the contract:
  - **qoder**: `-w`, `-p`, `-f json`, `--yolo`, `--max-turns` when set; no `--worktree`
  - **kimi**: `-p`, `--output-format stream-json`; no `--yolo` / `--auto` / `--plan`; `cwd` = worktree; `KIMI_CODE_HOME` under run dir
  - **pi**: `--mode json`, `-p`, `@<briefPath>`, `--approve`
  - **grok**: `--cwd`, `--prompt-file`, `--always-approve`, `--output-format json`; no `--worktree` / `-w` with headless
- Builder/list/dispatch tests import and call the shipped functions; they do not reimplement argv construction.
- `list_harnesses` always reports the four names; with binaries on PATH, versions are non-empty (covered by tests and confirmed live).

## Important issues

1. **Timeout may not bound a stubborn child** (`src/dispatch.ts`, `spawnLogged`)
   - On timeout the runner only sends `SIGTERM` and then waits for `close`. If the harness ignores `SIGTERM`, `runHarness` can hang past `timeout_ms`, so the run is not actually bounded.
   - Fix: after SIGTERM, escalate to `SIGKILL` (and/or `child.kill('SIGKILL')` on a short grace timer), then resolve with `timed_out: true`.

2. **`installed: true` can still carry `version: null`** (`src/list-harnesses.ts`)
   - Contract/design require a non-empty version string for installed binaries. `readVersion` may return `null` (empty output / spawn failure) while the row stays `installed: true`.
   - Fix: if version is null/empty, either set `installed: false` (path optional / noted) or keep installed only when `version` is a non-empty string; add a test for a silent version probe.

3. **MCP stdio drain is re-entrant** (`src/mcp.ts`)
   - Each `stdin` `data` event calls `drain()` without a mutex. While `await handle(req)` runs (especially `run_harness`), another chunk can start a second `drain()` and handle a second tool call concurrently, weakening the “one harness at a time” server behavior.
   - Fix: queue/serialize `drain` (single in-flight loop flag or promise chain) so requests are handled strictly one at a time.

## Minor notes

1. Unused Content-Length helper `write()` in `src/mcp.ts` while I/O is newline-delimited JSON only. Either delete it or implement framing on both read and write if Codex ever requires LSP-style framing.
2. `which()` treats any regular file on `PATH` as installed; it does not check the executable bit, so a non-executable stub can be reported installed and then fail at spawn/version.
3. Dispatch integration coverage only stubs **qoder**. Worktree/no-merge is covered, but kimi/pi/grok env and argv are not exercised end-to-end through `runHarness`.
4. Worktree + branch are created before the child binary is proven runnable; a missing executable leaves an orphan worktree/branch after a thrown spawn error.
5. Kimi’s runtime forbidden-flag loop cannot fire with the current builder (those flags are never inserted); the tests correctly assert absence instead—keep the assertion, consider dropping the dead loop or turning it into a shared invariant helper.

## Verdict

**approve**

No contract-breaking bugs on the dispatch/adapter surface. Address the Important timeout and `list_harnesses` version-enforcement items as follow-ups before relying on long-running or hostile CLI children in production.
