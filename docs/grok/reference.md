# Grok Build 1.0.13 — 命令与参数参考

格式说明：帮助快照保留完整参数文本，仅去除终端控制字符与行末空白。

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。


采集日期：2026-09-15（Asia/Shanghai）。PATH：`~/.local/bin/grok`；真实路径：`~/.grok/bin/grok`。

```text
$ grok --version
grok 1.0.13 (5e9a58528b76) [stable]
```

## 覆盖与来源规则

递归采集根及公开子命令的全部 `--help`，再通过本地源码发现并采集隐藏 `share`、`workspace` 及其6个子命令。共 76 条帮助调用，其中75条成功；`grok help --help` 退出2，正确的 `grok help` 已另行采集。所有结果（包括错误）均保留。`help <command> …` 是 Clap 的通用帮助转发入口，不重复无限展开各层 `help help`。

每个快照保留 Usage、位置参数、完整 Options、枚举、默认值、别名和下级 Commands。帮助列出的 `disk-usage`、`v` 等别名指向相同命令，不另算功能。出现无描述的参数时保持原样，不自行猜测用途。

隐藏参数来源为本地 Grok 源码仓库 commit `07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8`，随后用**本机 binary**执行参数后置 `--help` 的解析探针。解析成功不意味着运行行为、服务端授权或副作用已实测。源码提交与 binary 的 `5e9a58528b76` 不同，未经解析验证的源码能力单独标注。

## 命令索引

- [`grok`](#cli-0)
- [`grok agent`](#cli-1)
- [`grok clone`](#cli-2)
- [`grok completions`](#cli-3)
- [`grok dashboard`](#cli-4)
- [`grok doctor`](#cli-5)
- [`grok du`](#cli-6)
- [`grok export`](#cli-7)
- [`grok inspect`](#cli-8)
- [`grok leader`](#cli-9)
- [`grok login`](#cli-10)
- [`grok logout`](#cli-11)
- [`grok mcp`](#cli-12)
- [`grok memory`](#cli-13)
- [`grok models`](#cli-14)
- [`grok plugin`](#cli-15)
- [`grok sessions`](#cli-16)
- [`grok setup`](#cli-17)
- [`grok trace`](#cli-18)
- [`grok update`](#cli-19)
- [`grok version`](#cli-20)
- [`grok worktree`](#cli-21)
- [`grok wrap`](#cli-22)
- [`grok agent stdio`](#cli-23)
- [`grok agent headless`](#cli-24)
- [`grok agent serve`](#cli-25)
- [`grok agent leader`](#cli-26)
- [`grok doctor fix`](#cli-27)
- [`grok leader list`](#cli-28)
- [`grok leader info`](#cli-29)
- [`grok leader kill`](#cli-30)
- [`grok mcp list`](#cli-31)
- [`grok mcp add`](#cli-32)
- [`grok mcp remove`](#cli-33)
- [`grok mcp enable`](#cli-34)
- [`grok mcp disable`](#cli-35)
- [`grok mcp doctor`](#cli-36)
- [`grok memory clear`](#cli-37)
- [`grok plugin list`](#cli-38)
- [`grok plugin install`](#cli-39)
- [`grok plugin uninstall`](#cli-40)
- [`grok plugin update`](#cli-41)
- [`grok plugin enable`](#cli-42)
- [`grok plugin disable`](#cli-43)
- [`grok plugin details`](#cli-44)
- [`grok plugin validate`](#cli-45)
- [`grok plugin tag`](#cli-46)
- [`grok plugin marketplace`](#cli-47)
- [`grok sessions list`](#cli-48)
- [`grok sessions search`](#cli-49)
- [`grok sessions delete`](#cli-50)
- [`grok worktree list`](#cli-51)
- [`grok worktree show`](#cli-52)
- [`grok worktree rm`](#cli-53)
- [`grok worktree gc`](#cli-54)
- [`grok worktree detach`](#cli-55)
- [`grok worktree salvage`](#cli-56)
- [`grok worktree clean-artifacts`](#cli-57)
- [`grok worktree db`](#cli-58)
- [`grok plugin marketplace list`](#cli-59)
- [`grok plugin marketplace add`](#cli-60)
- [`grok plugin marketplace remove`](#cli-61)
- [`grok plugin marketplace update`](#cli-62)
- [`grok worktree db rebuild`](#cli-63)
- [`grok worktree db stats`](#cli-64)
- [`grok worktree db path`](#cli-65)
- [`grok share`](#cli-66)
- [`grok workspace`](#cli-67)
- [`grok help`](#cli-68)（失败调用；见正文）
- [`grok workspace start`](#cli-69)
- [`grok workspace pause`](#cli-70)
- [`grok workspace resume`](#cli-71)
- [`grok workspace stop`](#cli-72)
- [`grok workspace restart`](#cli-73)
- [`grok workspace status`](#cli-74)
- [`grok help`](#cli-75)

## 完整 CLI 帮助快照

<a id="cli-0"></a>

### `grok --help`

退出码：`0`。

```text
Grok Build TUI

Usage: grok [OPTIONS] [PROMPT] [COMMAND]

Arguments:
  [PROMPT]
          Initial prompt for the interactive session, e.g. `grok "fix the bug"` or `grok --worktree=feat "create this feature"`

Options:
      --agent <NAME>
          Agent name or definition file path

      --agents <JSON>
          Inline subagent definitions as JSON

      --allow <RULE>
          Permission allow rule (compat alias: --allowedTools)

      --always-approve
          Auto-approve all tool executions

  -c, --continue
          Continue the most recent session for the current working directory

      --cwd <CWD>
          Working directory

      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

      --deny <RULE>
          Permission deny rule (compat alias: --disallowedTools)

      --disable-web-search
          Disable web search and web fetch tools

      --disallowed-tools <TOOLS>
          Built-in tools to remove (comma-separated)

      --fork-session
          When resuming (`--resume` / `--continue`), create a new session ID instead of reusing the original (optionally set via `--session-id`)

      --fullscreen
          Open in the standard fullscreen TUI for this session, overriding a config `[ui] screen_mode = "minimal"` preference. Session-scoped only, does not write config. Fullscreen-vs-inline still follows the alt-screen policy (--no-alt-screen, [terminal] alt_screen, terminal auto-detection)

  -h, --help
          Print help (see a summary with '-h')

      --include-partial-messages
          Emit incremental `stream_event` lines (text/thinking deltas) alongside whole messages. Only affects `--output-format streaming-messages-json`

      --json-schema <SCHEMA>
          JSON Schema for structured output. When set, the model is constrained to produce JSON matching this schema. Implies --output-format json. Example: --json-schema '{"type":"object","properties":{"name":{"type":"string"}}}'

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`

  -m, --model <MODEL>
          Model ID to use

      --max-turns <N>
          Maximum number of agent turns

      --minimal
          Experimental: scrollback-native rendering. Finalized blocks are printed into the terminal's native scrollback (use the terminal's own scroll / selection). A small pinned region holds the prompt and running turn. Session-scoped only, does not write config. To default plain `grok` to minimal, set `[ui] screen_mode = "minimal"` in ~/.grok/config.toml

      --no-alt-screen
          Run inline instead of using the terminal alternate screen

      --no-plan
          Disable plan mode

      --no-subagents
          Disable subagent spawning

      --oauth
          Use OAuth when the welcome screen starts authentication

      --output-format <OUTPUT_FORMAT>
          Output format for headless mode

          Possible values:
          - plain
          - json
          - streaming-json:          NDJSON: one ACP session update per line, the agent's native format
          - streaming-messages-json: NDJSON in the Anthropic Messages API wire format

          [default: plain]

  -p, --single <PROMPT>
          Single-turn prompt. Prints the response to stdout and exits

      --permission-mode <MODE>
          Permission mode

          [possible values: default, acceptEdits, auto, dontAsk, bypassPermissions, plan]

      --prompt-file <PATH>
          Single-turn prompt from a file

      --prompt-json <JSON>
          Single-turn prompt as JSON content blocks

  -r, --resume [<SESSION_ID_OR_TITLE>]
          Resume a session by ID or title, or the most recent if omitted. Non-ID values match session titles for the current directory, ignoring letter case; UUID-shaped values always mean IDs. Among duplicate titles a sole renamed match wins; otherwise the resume fails as ambiguous

      --reasoning-effort <EFFORT>
          Reasoning effort for reasoning models

          [aliases: --effort]

      --restore-code
          Restore the original session's repository snapshot when resuming. Remote sessions require `--worktree` (never checks out into the current directory). Without this flag, resume restores conversation only

      --rules <RULES>
          Extra rules to append to the system prompt

  -s, --session-id <SESSION_ID>
          Use a specific session UUID for a **new** conversation (must be a valid UUID and must not already exist under the target session directory). With `--resume`/`--continue`, only valid together with `--fork-session` (names the forked session). Does not resume existing sessions, use `--resume` / `--continue` instead

      --sandbox <PROFILE>
          Sandbox profile for filesystem and network access

          [env: GROK_SANDBOX=]

      --system-prompt-override <PROMPT>
          Override the agent's system prompt (compat alias: --system-prompt)

      --tools <TOOLS>
          Built-in tools to allow (comma-separated)

  -v, --version
          Print version

      --verbatim
          Send the prompt exactly as given

  -w, --worktree [<WORKTREE>]
          Start the session in a new git worktree, optionally named. With `--resume` of a remote session, pass `--restore-code` to apply the snapshot codebase (conversation is restored either way). Headless (`-p`) does not create a worktree from this flag

      --worktree-ref <WORKTREE_REF>
          Branch, tag, or commit to base the worktree on (with `--worktree`). Defaults to the current HEAD of the source checkout when omitted

          [aliases: --ref]

Commands:
  agent        Run Grok without the interactive UI
  clone        Lazy-clone a git repository via grove (NFS on macOS, FUSE on Linux)
  completions  Generate shell completion scripts (bash, zsh, fish, powershell, ...)
  dashboard    Open the Agent Dashboard view at startup
  doctor       Check terminal, clipboard, color, and input support without starting Grok
  du           Show what the grok home (~/.grok) uses on disk [aliases: disk-usage]
  export       Export a session transcript as Markdown
  help         Print this message or the help of the given subcommand(s)
  inspect      Show the configuration Grok discovers for this directory
  leader       Manage running leader processes
  login        Sign in to Grok
  logout       Sign out and clear cached credentials
  mcp          Manage MCP server configurations
  memory       Manage cross-session memory
  models       List available models and exit
  plugin       Manage plugins and marketplace sources
  sessions     List, search, or restore sessions
  setup        Fetch and install managed configuration
  trace        Export or upload session trace data
  update       Check for updates or install a specific version
  version      Print version information [aliases: v]
  worktree     Manage git worktrees
  wrap         Run any command with local clipboard support (forwards OSC 52 to the system clipboard)
```

<a id="cli-1"></a>

### `grok agent --help`

退出码：`0`。

```text
Run Grok without the interactive UI

Usage: grok agent [OPTIONS] [COMMAND]

Commands:
  stdio     Run the agent over stdio
  headless  Run the agent headlessly over the Grok WebSocket relay
  serve     Run the agent as a WebSocket server
  leader    Run as the shared leader process for other clients
  help      Print this message or the help of the given subcommand(s)

Options:
      --reauth
          Run authentication before starting the agent [aliases: ----reauthenticate]
  -m, --model <MODEL>
          Model ID to use
      --reasoning-effort <EFFORT>
          Reasoning effort for reasoning models [aliases: --effort]
      --always-approve
          Auto-approve all tool executions
      --agent-profile <PATH>
          Path to an agent profile file
      --plugin-dir <DIR>
          Load a plugin from this directory for this process only (repeatable). Highest-priority plugin scope; always trusted: hooks and MCP servers activate without a prompt. Used by the Agent SDKs to inject per-connection plugins
      --leader
          Connect to a shared leader process instead of starting a new agent. Allows multiple clients to share one backend. Defaults to [cli] use_leader in config.toml
      --no-leader
          Start a new agent even when config enables leader mode
      --grok-ws-origin <GROK_WS_ORIGIN>

      --grok-ws-url <GROK_WS_URL>

      --cli-chat-proxy-base-url <CLI_CHAT_PROXY_BASE_URL>
          Override the CLI chat proxy base URL
      --xai-api-base-url <XAI_API_BASE_URL>
          Override the public xAI API base URL
      --debug
          Enable debug logging
      --debug-file <FILE>
          Write debug logs to FILE
  -h, --help
          Print help
      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-2"></a>

### `grok clone --help`

退出码：`0`。

```text
Lazy-clone a git repository via grove (NFS on macOS, FUSE on Linux)

Usage: grok clone [OPTIONS] <URL> [DIR]

Arguments:
  <URL>  Remote repository URL
  [DIR]  Local directory for the mount (default: basename of the URL)

Options:
  -b, --branch <BRANCH>       Branch or ref to check out
      --cone <PATH>           Sparse-checkout cone path (repeatable)
      --full-history          Fetch complete history during clone instead of the fast depth-1 bootstrap. After a depth-1 clone, `git fetch --deepen=N origin` / `--unshallow origin` affect only the selected branch. Another branch needs an explicit depth-limited refspec
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-3"></a>

### `grok completions --help`

退出码：`0`。

```text
Generate shell completion scripts (bash, zsh, fish, powershell, ...)

Usage: grok completions [OPTIONS] <SHELL>

Arguments:
  <SHELL>  Target shell [possible values: bash, elvish, fish, powershell, zsh]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-4"></a>

### `grok dashboard --help`

退出码：`0`。

```text
Open the Agent Dashboard view at startup.

The dashboard shows every session, top-level and subagents. Disabled when `[dashboard].enabled = false` in `~/.grok/config.toml` or when the `GROK_AGENT_DASHBOARD=0` env var is set.

Usage: grok dashboard [OPTIONS]

Options:
      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

  -h, --help
          Print help (see a summary with '-h')

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-5"></a>

### `grok doctor --help`

退出码：`0`。

```text
Check terminal, clipboard, color, and input support without starting Grok

Usage: grok doctor [OPTIONS]
       grok doctor <COMMAND>

Commands:
  fix   Apply an automatic fix
  help  Print this message or the help of the given subcommand(s)

Options:
      --json                  Print the diagnostic report as JSON
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-6"></a>

### `grok du --help`

退出码：`0`。

```text
Show what the grok home (~/.grok) uses on disk

Usage: grok du [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`

Lists every top-level directory in the grok home, largest first, then every worktree under `worktrees/` and `worktree_pool/` with its size, age, and label. To reclaim space, preview a sweep with `grok worktree gc --max-age 7d --dry-run`: without `--max-age`, gc expires nothing, it visits only worktrees the registry tracks, and it keeps a worktree whose work it cannot find elsewhere.
```

<a id="cli-7"></a>

### `grok export --help`

退出码：`0`。

```text
Export a session transcript as Markdown

Usage: grok export [OPTIONS] <SESSION_ID> [OUTPUT]

Arguments:
  <SESSION_ID>  Session ID to export
  [OUTPUT]      Output file path (default: stdout)

Options:
  -c, --clipboard             Copy to clipboard instead of writing to stdout
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-8"></a>

### `grok inspect --help`

退出码：`0`。

```text
Show the configuration Grok discovers for this directory

Usage: grok inspect [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-9"></a>

### `grok leader --help`

退出码：`0`。

```text
Manage running leader processes

Usage: grok leader [OPTIONS] <COMMAND>

Commands:
  list  List running leader processes
  info  Show details for a leader process
  kill  Stop all running leader processes
  help  Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-10"></a>

### `grok login --help`

退出码：`0`。

```text
Sign in to Grok

Usage: grok login [OPTIONS]

Options:
      --oauth                 Use Grok OAuth via auth.x.ai
      --device-auth           Use device-code authentication for headless/remote environments [aliases: --device-code]
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-11"></a>

### `grok logout --help`

退出码：`0`。

```text
Sign out and clear cached credentials

Usage: grok logout [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-12"></a>

### `grok mcp --help`

退出码：`0`。

```text
Manage MCP server configurations

Usage: grok mcp [OPTIONS] <COMMAND>

Commands:
  list     List configured MCP servers
  add      Add or update an MCP server
  remove   Remove an MCP server
  enable   Enable an MCP server
  disable  Disable an MCP server
  doctor   Diagnose MCP server configuration and connectivity
  help     Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-13"></a>

### `grok memory --help`

退出码：`0`。

```text
Manage cross-session memory

Usage: grok memory [OPTIONS] <COMMAND>

Commands:
  clear  Clear memory files (workspace by default)
  help   Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-14"></a>

### `grok models --help`

退出码：`0`。

```text
List available models and exit

Usage: grok models [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-15"></a>

### `grok plugin --help`

退出码：`0`。

```text
Manage plugins and marketplace sources

Usage: grok plugin [OPTIONS] <COMMAND>

Commands:
  list         List installed plugins
  install      Install a plugin from a git URL or local path
  uninstall    Uninstall an installed plugin by name [aliases: rm, remove]
  update       Update installed plugin(s)
  enable       Enable a disabled plugin
  disable      Disable a plugin without uninstalling it
  details      Show a plugin's component inventory
  validate     Validate a plugin manifest
  tag          Create a release git tag from the plugin's manifest version
  marketplace  Manage marketplace sources
  help         Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-16"></a>

### `grok sessions --help`

退出码：`0`。

```text
List, search, or restore sessions

Usage: grok sessions [OPTIONS] <COMMAND>

Commands:
  list    List recent sessions (same as search with no query)
  search  Search sessions by keyword
  delete  Permanently delete a session from history
  help    Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-17"></a>

### `grok setup --help`

退出码：`0`。

```text
Fetch and install managed configuration

Usage: grok setup [OPTIONS]

Options:
      --json                  Print the fetched configuration as JSON instead of installing it; writes nothing to ~/.grok
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-18"></a>

### `grok trace --help`

退出码：`0`。

```text
Export or upload session trace data

Usage: grok trace [OPTIONS] <SESSION_ID>

Arguments:
  <SESSION_ID>  Session ID to export/upload

Options:
      --local                 Save locally only, skip remote upload
  -o, --output <OUTPUT>       Output path (default: $GROK_HOME/trace-exports/<session-id>.tar.gz)
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-19"></a>

### `grok update --help`

退出码：`0`。

```text
Check for updates or install a specific version

Usage: grok update [OPTIONS]

Options:
      --check                 Check for updates without installing
      --json                  Emit machine-readable JSON output (for --check)
      --force-reinstall       Force re-download and install even if already up to date
      --version <VERSION>     Install a specific version (e.g. 0.1.150 or 0.1.151-alpha.2)
      --alpha                 Switch to the alpha release channel (faster updates, may have bugs)
      --stable                Switch to the stable release channel (default, weekly releases)
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-20"></a>

### `grok version --help`

退出码：`0`。

```text
Print version information

Usage: grok version [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-21"></a>

### `grok worktree --help`

退出码：`0`。

```text
Manage git worktrees

Usage: grok worktree [OPTIONS] <COMMAND>

Commands:
  list             List tracked worktrees [aliases: ls]
  show             Show details for a specific worktree
  rm               Remove worktrees
  gc               Remove expired worktrees, keeping any whose work would not survive
  detach           Convert an NFS-projected worktree into a plain git worktree
  salvage          Recover hydrated and dirty files when the source repo is gone
  clean-artifacts  Purge escape-dir artifact contents (`git clean` does not)
  db               Database maintenance
  help             Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-22"></a>

### `grok wrap --help`

退出码：`0`。

```text
Run any command inside a local PTY that forwards its clipboard to yours.

Wraps an arbitrary command (for example `docker exec`, `kubectl exec`, or a
remote shell) in a local pseudo-terminal, intercepts OSC 52 clipboard escape
sequences from its output, and writes them to your local system clipboard. This
makes copy work when the program runs somewhere that cannot reach your
clipboard (containers, SSH) and your terminal does not handle OSC 52 itself
(for example Apple Terminal). The wrapped command's terminal is also kept in
sync with your window size.

Examples:
  grok wrap docker exec -it my-container bash
  grok wrap kubectl exec -it my-pod -- bash

See ~/.grok/README.md for more information.


Usage: grok wrap [OPTIONS] <CMD>...

Arguments:
  <CMD>...
          Command to run, followed by its arguments (e.g. `docker exec -it my-container bash`). On Unix a single quoted string or an aliased command runs via `$SHELL -i -c`

Options:
      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

  -h, --help
          Print help (see a summary with '-h')

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-23"></a>

### `grok agent stdio --help`

退出码：`0`。

```text
Run the agent over stdio

Usage: grok agent stdio [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-24"></a>

### `grok agent headless --help`

退出码：`0`。

```text
Run the agent headlessly over the Grok WebSocket relay

Usage: grok agent headless [OPTIONS]

Options:
      --grok-ws-origin <GROK_WS_ORIGIN>

      --grok-ws-url <GROK_WS_URL>

      --debug
          Enable debug logging
      --debug-file <FILE>
          Write debug logs to FILE
  -h, --help
          Print help
      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-25"></a>

### `grok agent serve --help`

退出码：`0`。

```text
Run the agent as a WebSocket server

Usage: grok agent serve [OPTIONS]

Options:
      --bind <BIND>
          Address for the server to listen on [default: 127.0.0.1:2419]
      --secret <SECRET>
          Secret token for client authentication (auto-generated if not provided) [env: GROK_AGENT_SECRET=]
      --remote <REMOTE>
          Remote agent URL for proxy mode
      --grok-ws-origin <GROK_WS_ORIGIN>

      --grok-ws-url <GROK_WS_URL>

      --debug
          Enable debug logging
      --debug-file <FILE>
          Write debug logs to FILE
  -h, --help
          Print help
      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-26"></a>

### `grok agent leader --help`

退出码：`0`。

```text
Run as the shared leader process for other clients

Usage: grok agent leader [OPTIONS]

Options:
      --no-exit-on-disconnect
          Keep the leader running after the last client disconnects
      --relay-on-demand
          Defer the grok.com relay WebSocket until the first headless IPC client registers. Without this flag the leader connects the relay eagerly at startup. Bare leaders (headless remote env / systemd) need the eager connect: they receive remote prompts *through* the relay. Passed by leaders auto-spawned from interactive clients (TUI/IDE), which only need the relay if a headless client appears
      --no-auto-update
          Disable periodic auto-update checks for the leader
      --grok-ws-origin <GROK_WS_ORIGIN>

      --grok-ws-url <GROK_WS_URL>

      --debug
          Enable debug logging
      --debug-file <FILE>
          Write debug logs to FILE
  -h, --help
          Print help
      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-27"></a>

### `grok doctor fix --help`

退出码：`0`。

```text
Apply an automatic fix

Usage: grok doctor fix [OPTIONS] [ID]

Arguments:
  [ID]  Named fix to apply. Omit it to list available automatic fixes

Options:
      --yes                   Apply the displayed changes without confirmation
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-28"></a>

### `grok leader list --help`

退出码：`0`。

```text
List running leader processes

Usage: grok leader list [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-29"></a>

### `grok leader info --help`

退出码：`0`。

```text
Show details for a leader process

Usage: grok leader info [OPTIONS]

Options:
      --pid <PID>             Leader process ID from `grok leader list`
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-30"></a>

### `grok leader kill --help`

退出码：`0`。

```text
Stop all running leader processes

Usage: grok leader kill [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-31"></a>

### `grok mcp list --help`

退出码：`0`。

```text
List configured MCP servers

Usage: grok mcp list [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-32"></a>

### `grok mcp add --help`

退出码：`0`。

```text
Add or update an MCP server

Usage: grok mcp add [OPTIONS] <NAME> [COMMAND_OR_URL] [ARGS]...

Arguments:
  <NAME>
          Server name

  [COMMAND_OR_URL]
          Command to launch (stdio) or URL to connect to (http, sse)

  [ARGS]...
          Arguments passed to the server command. Place them after `--` so flags such as `-y` are passed to the server instead of grok

Options:
  -t, --transport <TRANSPORT>
          Transport type. Defaults to stdio, or to http when the positional argument is an http(s):// URL

          Possible values:
          - stdio: Launch a local process and communicate over stdin/stdout
          - http:  Connect to a remote server over streamable HTTP
          - sse:   Connect to a remote server over Server-Sent Events

  -s, --scope <SCOPE>
          Config to write to: user (~/.grok/config.toml) or project (./.grok/config.toml)

          Possible values:
          - user:    `~/.grok/config.toml`, available in all your projects
          - project: `./.grok/config.toml`, shared with everyone working in this directory

          [default: user]

  -e, --env <KEY=value>
          Environment variable for the server process (repeatable)

  -H, --header <NAME: VALUE>
          HTTP header for remote servers (repeatable)

      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

  -h, --help
          Print help (see a summary with '-h')

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`

Examples:
  # Add a stdio server (everything after -- is the server command)
  grok mcp add xcode -- xcrun mcpbridge

  # Add a stdio server with environment variables
  grok mcp add postgres -e DATABASE_URL=postgres://localhost/mydb -- npx -y @modelcontextprotocol/server-postgres

  # Add a remote HTTP server
  grok mcp add --transport http sentry https://mcp.sentry.dev/mcp

  # Add a remote server with an authentication header
  grok mcp add --transport http api https://mcp.example.com/mcp --header "Authorization: Bearer YOUR_TOKEN"

  # Add to the project config (./.grok/config.toml) instead of ~/.grok/config.toml
  grok mcp add --scope project github -- npx -y @modelcontextprotocol/server-github
```

<a id="cli-33"></a>

### `grok mcp remove --help`

退出码：`0`。

```text
Remove an MCP server

Usage: grok mcp remove [OPTIONS] <NAME>

Arguments:
  <NAME>
          Server name to remove

Options:
  -s, --scope <SCOPE>
          Config to remove from. When omitted, all scopes are searched

          Possible values:
          - user:    `~/.grok/config.toml`, available in all your projects
          - project: `./.grok/config.toml`, shared with everyone working in this directory

      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

  -h, --help
          Print help (see a summary with '-h')

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-34"></a>

### `grok mcp enable --help`

退出码：`0`。

```text
Enable an MCP server

Usage: grok mcp enable [OPTIONS] <NAME>

Arguments:
  <NAME>  Server name

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-35"></a>

### `grok mcp disable --help`

退出码：`0`。

```text
Disable an MCP server

Usage: grok mcp disable [OPTIONS] <NAME>

Arguments:
  <NAME>  Server name

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-36"></a>

### `grok mcp doctor --help`

退出码：`0`。

```text
Diagnose MCP server configuration and connectivity

Usage: grok mcp doctor [OPTIONS] [NAME]

Arguments:
  [NAME]  Server name to check

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-37"></a>

### `grok memory clear --help`

退出码：`0`。

```text
Clear memory files (workspace by default)

Usage: grok memory clear [OPTIONS]

Options:
      --workspace             Clear workspace-scoped memory (MEMORY.md, sessions/, index.sqlite)
      --global                Clear global MEMORY.md
      --all                   Clear both workspace and global memory
  -y, --yes                   Skip confirmation prompt
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-38"></a>

### `grok plugin list --help`

退出码：`0`。

```text
List installed plugins

Usage: grok plugin list [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --available             Include available plugins from marketplace sources. Requires --json
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-39"></a>

### `grok plugin install --help`

退出码：`0`。

```text
Install a plugin from a git URL or local path

Usage: grok plugin install [OPTIONS] <SOURCE>

Arguments:
  <SOURCE>  Git URL, GitHub shorthand (user/repo), or local path. Supports @ref suffix (e.g. user/repo@v1.0) and #subdir

Options:
      --trust                 Trust the plugin immediately (skip confirmation prompt)
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-40"></a>

### `grok plugin uninstall --help`

退出码：`0`。

```text
Uninstall an installed plugin by name

Usage: grok plugin uninstall [OPTIONS] <NAME>

Arguments:
  <NAME>  Plugin name (as shown by `grok plugin list`)

Options:
      --confirm               Skip confirmation for multi-plugin repos
      --keep-data             Preserve the plugin's persistent data directory
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-41"></a>

### `grok plugin update --help`

退出码：`0`。

```text
Update installed plugin(s)

Usage: grok plugin update [OPTIONS] [NAME]

Arguments:
  [NAME]  Plugin name to update. Omit to update all

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-42"></a>

### `grok plugin enable --help`

退出码：`0`。

```text
Enable a disabled plugin

Usage: grok plugin enable [OPTIONS] <NAME>

Arguments:
  <NAME>  Plugin name to enable

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-43"></a>

### `grok plugin disable --help`

退出码：`0`。

```text
Disable a plugin without uninstalling it

Usage: grok plugin disable [OPTIONS] <NAME>

Arguments:
  <NAME>  Plugin name to disable

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-44"></a>

### `grok plugin details --help`

退出码：`0`。

```text
Show a plugin's component inventory

Usage: grok plugin details [OPTIONS] <NAME>

Arguments:
  <NAME>  Plugin name

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-45"></a>

### `grok plugin validate --help`

退出码：`0`。

```text
Validate a plugin manifest

Usage: grok plugin validate [OPTIONS] [PATH]

Arguments:
  [PATH]  Path to plugin directory (default: current directory) [default: .]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-46"></a>

### `grok plugin tag --help`

退出码：`0`。

```text
Create a release git tag from the plugin's manifest version

Usage: grok plugin tag [OPTIONS] [PATH]

Arguments:
  [PATH]  Path to plugin directory (default: current directory) [default: .]

Options:
      --push                  Push the tag to the remote after creating it
  -f, --force                 Create the tag even if the working tree is dirty or tag exists
      --dry-run               Print what would be tagged without creating the tag
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-47"></a>

### `grok plugin marketplace --help`

退出码：`0`。

```text
Manage marketplace sources

Usage: grok plugin marketplace [OPTIONS] <COMMAND>

Commands:
  list    List configured marketplace sources and their plugins
  add     Add a marketplace source (git URL, GitHub shorthand, or local path)
  remove  Remove a marketplace source and uninstall its plugins
  update  Refresh marketplace source(s) and sync git caches
  help    Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-48"></a>

### `grok sessions list --help`

退出码：`0`。

```text
List recent sessions (same as search with no query)

Usage: grok sessions list [OPTIONS]

Options:
  -n, --limit <LIMIT>         Maximum number of sessions to show [default: 20]
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-49"></a>

### `grok sessions search --help`

退出码：`0`。

```text
Search sessions by keyword

Usage: grok sessions search [OPTIONS] <QUERY>

Arguments:
  <QUERY>  Search query (searches summaries and first prompts)

Options:
  -n, --limit <LIMIT>         Maximum number of sessions to show [default: 20]
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-50"></a>

### `grok sessions delete --help`

退出码：`0`。

```text
Permanently delete a session from history

Usage: grok sessions delete [OPTIONS] <ID>

Arguments:
  <ID>  Session id to delete

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-51"></a>

### `grok worktree list --help`

退出码：`0`。

```text
List tracked worktrees

Usage: grok worktree list [OPTIONS]

Options:
      --repo <REPO>
      --type <TYPE>
      --json
      --all
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-52"></a>

### `grok worktree show --help`

退出码：`0`。

```text
Show details for a specific worktree

Usage: grok worktree show [OPTIONS] <ID_OR_PATH>

Arguments:
  <ID_OR_PATH>

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-53"></a>

### `grok worktree rm --help`

退出码：`0`。

```text
Remove worktrees

Usage: grok worktree rm [OPTIONS] <IDS>...

Arguments:
  <IDS>...

Options:
  -f, --force
      --dry-run
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-54"></a>

### `grok worktree gc --help`

退出码：`0`。

```text
Remove expired worktrees, keeping any whose work would not survive

Usage: grok worktree gc [OPTIONS]

Options:
      --dry-run               Report what would be removed without removing it
      --max-age <MAX_AGE>     Expire worktrees idle longer than this, e.g. `7d`. Without it, nothing expires
  -f, --force                 Skip the live-process and protected-path guards. This does not override the safety check; use `grok worktree rm` for that
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-55"></a>

### `grok worktree detach --help`

退出码：`0`。

```text
Convert an NFS-projected worktree into a plain git worktree

Usage: grok worktree detach [OPTIONS] <ID_OR_PATH>

Arguments:
  <ID_OR_PATH>

Options:
      --allow-copy            Permit a copy when dest and backing are on different devices
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-56"></a>

### `grok worktree salvage --help`

退出码：`0`。

```text
Recover hydrated and dirty files when the source repo is gone

Usage: grok worktree salvage [OPTIONS] --out <OUT> <ID_OR_PATH>

Arguments:
  <ID_OR_PATH>

Options:
      --out <OUT>             Directory to write the salvaged plain repo into
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-57"></a>

### `grok worktree clean-artifacts --help`

退出码：`0`。

```text
Purge escape-dir artifact contents (`git clean` does not)

Usage: grok worktree clean-artifacts [OPTIONS] <ID_OR_PATH>

Arguments:
  <ID_OR_PATH>

Options:
      --dry-run               List jail children and exit without deleting
      --yes                   Required to actually delete (irreversible)
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-58"></a>

### `grok worktree db --help`

退出码：`0`。

```text
Database maintenance

Usage: grok worktree db [OPTIONS] <COMMAND>

Commands:
  rebuild  Rebuild DB from filesystem scan
  stats    Show DB statistics
  path     Print DB file path
  help     Print this message or the help of the given subcommand(s)

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-59"></a>

### `grok plugin marketplace list --help`

退出码：`0`。

```text
List configured marketplace sources and their plugins

Usage: grok plugin marketplace list [OPTIONS]

Options:
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-60"></a>

### `grok plugin marketplace add --help`

退出码：`0`。

```text
Add a marketplace source (git URL, GitHub shorthand, or local path)

Usage: grok plugin marketplace add [OPTIONS] <URL>

Arguments:
  <URL>  Git URL, GitHub shorthand (e.g. user/repo), or local directory path

Options:
      --force                 Skip the reachability probe (e.g. for hosts only reachable on VPN)
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-61"></a>

### `grok plugin marketplace remove --help`

退出码：`0`。

```text
Remove a marketplace source and uninstall its plugins

Usage: grok plugin marketplace remove [OPTIONS] <SOURCE>

Arguments:
  <SOURCE>  Name, git URL, or local path of the source to remove

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-62"></a>

### `grok plugin marketplace update --help`

退出码：`0`。

```text
Refresh marketplace source(s) and sync git caches

Usage: grok plugin marketplace update [OPTIONS] [NAME]

Arguments:
  [NAME]  Source URL to refresh. Omit to refresh all

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-63"></a>

### `grok worktree db rebuild --help`

退出码：`0`。

```text
Rebuild DB from filesystem scan

Usage: grok worktree db rebuild [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-64"></a>

### `grok worktree db stats --help`

退出码：`0`。

```text
Show DB statistics

Usage: grok worktree db stats [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-65"></a>

### `grok worktree db path --help`

退出码：`0`。

```text
Print DB file path

Usage: grok worktree db path [OPTIONS]

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-66"></a>

### `grok share --help`

退出码：`0`。

```text
Share a session and print the share URL

Usage: grok share [OPTIONS] <SESSION_ID>

Arguments:
  <SESSION_ID>  Session ID to share

Options:
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-67"></a>

### `grok workspace --help`

退出码：`0`。

```text
Expose this workspace to the Computer Hub (via the leader).

Disabled by default and enabled server-side per account; set `GROK_WORKSPACE_COMMAND=1` to enable it locally for testing.

Usage: grok workspace [OPTIONS] <COMMAND>

Commands:
  start    Start (or update) the workspace-to-hub exposure
  pause    Drain and disconnect from the hub, keeping the exposure warm
  resume   Reconnect a paused exposure to the hub
  stop     Stop exposing the workspace (the leader keeps running)
  restart  Restart the exposure (stop, then start with the given options)
  status   Show the current workspace-exposure status [aliases: list]
  help     Print this message or the help of the given subcommand(s)

Options:
      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

  -h, --help
          Print help (see a summary with '-h')

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-68"></a>

### `grok help --help`

退出码：`2`。

stderr：

```text
error: unrecognized subcommand '--help'

Usage: grok [OPTIONS] [PROMPT] [COMMAND]

For more information, try '--help'.
```

<a id="cli-69"></a>

### `grok workspace start --help`

退出码：`0`。

```text
Start (or update) the workspace-to-hub exposure

Usage: grok workspace start [OPTIONS]

Options:
      --hub-url <URL>         Computer Hub WebSocket URL (default: `[hub].url`, then the prod hub)
      --cwd <DIR>             Workspace root directory to expose. Defaults to the current directory
      --leader                Force leader mode for this command, overriding config
      --no-leader             Refuse to start even when config enables leader mode
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-70"></a>

### `grok workspace pause --help`

退出码：`0`。

```text
Drain and disconnect from the hub, keeping the exposure warm

Usage: grok workspace pause [OPTIONS]

Options:
      --pid <PID>             Leader process ID from `grok leader list`
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-71"></a>

### `grok workspace resume --help`

退出码：`0`。

```text
Reconnect a paused exposure to the hub

Usage: grok workspace resume [OPTIONS]

Options:
      --pid <PID>             Leader process ID from `grok leader list`
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-72"></a>

### `grok workspace stop --help`

退出码：`0`。

```text
Stop exposing the workspace (the leader keeps running)

Usage: grok workspace stop [OPTIONS]

Options:
      --pid <PID>             Leader process ID from `grok leader list`
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-73"></a>

### `grok workspace restart --help`

退出码：`0`。

```text
Restart the exposure (stop, then start with the given options)

Usage: grok workspace restart [OPTIONS]

Options:
      --hub-url <URL>         Computer Hub WebSocket URL (default: `[hub].url`, then the prod hub)
      --cwd <DIR>             Workspace root directory to expose. Defaults to the current directory
      --leader                Force leader mode for this command, overriding config
      --no-leader             Refuse to start even when config enables leader mode
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-74"></a>

### `grok workspace status --help`

退出码：`0`。

```text
Show the current workspace-exposure status

Usage: grok workspace status [OPTIONS]

Options:
      --pid <PID>             Leader process ID from `grok leader list`
      --json                  Emit machine-readable JSON output
      --debug                 Enable debug logging
      --debug-file <FILE>     Write debug logs to FILE
  -h, --help                  Print help
      --leader-socket <PATH>  Use a custom leader socket path instead of the default `~/.grok/leader.sock`
```

<a id="cli-75"></a>

### `grok help`

退出码：`0`。

```text
Grok Build TUI

Usage: grok [OPTIONS] [PROMPT] [COMMAND]

Arguments:
  [PROMPT]
          Initial prompt for the interactive session, e.g. `grok "fix the bug"` or `grok --worktree=feat "create this feature"`

Options:
      --agent <NAME>
          Agent name or definition file path

      --agents <JSON>
          Inline subagent definitions as JSON

      --allow <RULE>
          Permission allow rule (compat alias: --allowedTools)

      --always-approve
          Auto-approve all tool executions

  -c, --continue
          Continue the most recent session for the current working directory

      --cwd <CWD>
          Working directory

      --debug
          Enable debug logging

      --debug-file <FILE>
          Write debug logs to FILE

      --deny <RULE>
          Permission deny rule (compat alias: --disallowedTools)

      --disable-web-search
          Disable web search and web fetch tools

      --disallowed-tools <TOOLS>
          Built-in tools to remove (comma-separated)

      --fork-session
          When resuming (`--resume` / `--continue`), create a new session ID instead of reusing the original (optionally set via `--session-id`)

      --fullscreen
          Open in the standard fullscreen TUI for this session, overriding a config `[ui] screen_mode = "minimal"` preference. Session-scoped only, does not write config. Fullscreen-vs-inline still follows the alt-screen policy (--no-alt-screen, [terminal] alt_screen, terminal auto-detection)

  -h, --help
          Print help (see a summary with '-h')

      --include-partial-messages
          Emit incremental `stream_event` lines (text/thinking deltas) alongside whole messages. Only affects `--output-format streaming-messages-json`

      --json-schema <SCHEMA>
          JSON Schema for structured output. When set, the model is constrained to produce JSON matching this schema. Implies --output-format json. Example: --json-schema '{"type":"object","properties":{"name":{"type":"string"}}}'

      --leader-socket <PATH>
          Use a custom leader socket path instead of the default `~/.grok/leader.sock`

  -m, --model <MODEL>
          Model ID to use

      --max-turns <N>
          Maximum number of agent turns

      --minimal
          Experimental: scrollback-native rendering. Finalized blocks are printed into the terminal's native scrollback (use the terminal's own scroll / selection). A small pinned region holds the prompt and running turn. Session-scoped only, does not write config. To default plain `grok` to minimal, set `[ui] screen_mode = "minimal"` in ~/.grok/config.toml

      --no-alt-screen
          Run inline instead of using the terminal alternate screen

      --no-plan
          Disable plan mode

      --no-subagents
          Disable subagent spawning

      --oauth
          Use OAuth when the welcome screen starts authentication

      --output-format <OUTPUT_FORMAT>
          Output format for headless mode

          Possible values:
          - plain
          - json
          - streaming-json:          NDJSON: one ACP session update per line, the agent's native format
          - streaming-messages-json: NDJSON in the Anthropic Messages API wire format

          [default: plain]

  -p, --single <PROMPT>
          Single-turn prompt. Prints the response to stdout and exits

      --permission-mode <MODE>
          Permission mode

          [possible values: default, acceptEdits, auto, dontAsk, bypassPermissions, plan]

      --prompt-file <PATH>
          Single-turn prompt from a file

      --prompt-json <JSON>
          Single-turn prompt as JSON content blocks

  -r, --resume [<SESSION_ID_OR_TITLE>]
          Resume a session by ID or title, or the most recent if omitted. Non-ID values match session titles for the current directory, ignoring letter case; UUID-shaped values always mean IDs. Among duplicate titles a sole renamed match wins; otherwise the resume fails as ambiguous

      --reasoning-effort <EFFORT>
          Reasoning effort for reasoning models

          [aliases: --effort]

      --restore-code
          Restore the original session's repository snapshot when resuming. Remote sessions require `--worktree` (never checks out into the current directory). Without this flag, resume restores conversation only

      --rules <RULES>
          Extra rules to append to the system prompt

  -s, --session-id <SESSION_ID>
          Use a specific session UUID for a **new** conversation (must be a valid UUID and must not already exist under the target session directory). With `--resume`/`--continue`, only valid together with `--fork-session` (names the forked session). Does not resume existing sessions, use `--resume` / `--continue` instead

      --sandbox <PROFILE>
          Sandbox profile for filesystem and network access

          [env: GROK_SANDBOX=]

      --system-prompt-override <PROMPT>
          Override the agent's system prompt (compat alias: --system-prompt)

      --tools <TOOLS>
          Built-in tools to allow (comma-separated)

  -v, --version
          Print version

      --verbatim
          Send the prompt exactly as given

  -w, --worktree [<WORKTREE>]
          Start the session in a new git worktree, optionally named. With `--resume` of a remote session, pass `--restore-code` to apply the snapshot codebase (conversation is restored either way). Headless (`-p`) does not create a worktree from this flag

      --worktree-ref <WORKTREE_REF>
          Branch, tag, or commit to base the worktree on (with `--worktree`). Defaults to the current HEAD of the source checkout when omitted

          [aliases: --ref]

Commands:
  agent        Run Grok without the interactive UI
  clone        Lazy-clone a git repository via grove (NFS on macOS, FUSE on Linux)
  completions  Generate shell completion scripts (bash, zsh, fish, powershell, ...)
  dashboard    Open the Agent Dashboard view at startup
  doctor       Check terminal, clipboard, color, and input support without starting Grok
  du           Show what the grok home (~/.grok) uses on disk [aliases: disk-usage]
  export       Export a session transcript as Markdown
  help         Print this message or the help of the given subcommand(s)
  inspect      Show the configuration Grok discovers for this directory
  leader       Manage running leader processes
  login        Sign in to Grok
  logout       Sign out and clear cached credentials
  mcp          Manage MCP server configurations
  memory       Manage cross-session memory
  models       List available models and exit
  plugin       Manage plugins and marketplace sources
  sessions     List, search, or restore sessions
  setup        Fetch and install managed configuration
  trace        Export or upload session trace data
  update       Check for updates or install a specific version
  version      Print version information [aliases: v]
  worktree     Manage git worktrees
  wrap         Run any command with local clipboard support (forwards OSC 52 to the system clipboard)
```

## 隐藏参数与兼容别名

以下39组参数在本机1.0.13均通过解析并输出帮助（exit 0）。每行的“解析探针”均需在结尾加 `--help`；这只是记录本次验证方式，不表示已运行参数对应操作。详细语义来自上述不同提交的源码，运行效果未验证。

| 参数 / 范围 | 用途或对应公开参数 |
| --- | --- |
| `--trust`、`--trust-folder` | 项目信任并持久化选择 |
| `--compaction-mode <MODE>` | summary/transcript/segments 压缩方式 |
| `--compaction-detail <DETAIL>` | segments 模式细节 none/minimal/balanced/verbose |
| `--load <SESSION_ID>` | 旧会话恢复入口，等价用途见 `--resume`；与 continue 冲突 |
| `--no-ask-user` | 关闭结构化提问 |
| `--experimental-memory`、`--no-memory` | 旧内存功能启停兼容参数，互斥 |
| `--no-wait-for-background` | headless 首轮结束后不等待后台任务 |
| `--background-wait-timeout <SECS>` | 后台任务等待秒数；源码默认600，正整数，与 no-wait 冲突 |
| `--storage-mode <MODE>` | local/writeback 会话存储方式 |
| `--client-identifier <ID>` | 客户端标识 |
| `--hunk-tracker-mode <MODE>` | agent_only/all_dirty/off（disabled 为 off 别名） |
| `--terminal`、`--fs-read`、`--fs-write` | 客户端能力标志 |
| `--no-auto-update` | 本次禁用自动更新 |
| `--todo-gate` | 本次启用回合结束 TodoGate |
| `--installer <VALUE>` | installer 配置字段 |
| `--log-sampling` | sampling 日志 |
| `--force-login` | 强制显示登录界面 |
| `--leader`、`--no-leader` | 共享 leader 或独立运行，互斥 |
| `--yolo`、`--dangerously-skip-permissions` | `--always-approve` 兼容别名 |
| `--print <PROMPT>` | `--single/-p` 兼容别名 |
| `--append-system-prompt <RULES>` | `--rules` 兼容别名 |
| `--system-prompt <PROMPT>` | `--system-prompt-override` 兼容别名 |
| `--allowedTools <RULE>`、`--disallowedTools <RULE>` | `--allow`、`--deny` 的兼容别名 |
| `login --legacy` | 旧兼容标志，源码注明忽略 |
| `login --oidc` | `login --oauth` 兼容别名 |
| `update --enterprise` | enterprise 更新渠道；与 alpha/stable 冲突 |
| `update --trigger <VALUE>`、`update --auto` | 更新来源标识；auto 是旧内部别名 |
| `mcp add <NAME> --command <COMMAND>` | 旧 stdio 命令指定方式 |
| `mcp add <NAME> --command <COMMAND> --args <ARGS…>` | 旧 stdio 参数，要求 command |
| `mcp add <NAME> --url <URL>` | 旧远程服务URL参数 |
| `mcp add <NAME> --url <URL> --type <TYPE>` | 旧远程 transport 类型 |

### 解析探针清单

```text
grok --trust --help  # exit 0
grok --trust-folder --help  # exit 0
grok --compaction-mode summary --help  # exit 0
grok --compaction-detail verbose --help  # exit 0
grok --load doc-probe --help  # exit 0
grok --no-ask-user --help  # exit 0
grok --experimental-memory --help  # exit 0
grok --no-memory --help  # exit 0
grok --no-wait-for-background --help  # exit 0
grok --background-wait-timeout 600 --help  # exit 0
grok --storage-mode local --help  # exit 0
grok --client-identifier doc-probe --help  # exit 0
grok --hunk-tracker-mode off --help  # exit 0
grok --terminal --help  # exit 0
grok --fs-read --help  # exit 0
grok --fs-write --help  # exit 0
grok --no-auto-update --help  # exit 0
grok --todo-gate --help  # exit 0
grok --installer doc-probe --help  # exit 0
grok --log-sampling --help  # exit 0
grok --force-login --help  # exit 0
grok --leader --help  # exit 0
grok --no-leader --help  # exit 0
grok --yolo --help  # exit 0
grok --dangerously-skip-permissions --help  # exit 0
grok --print doc-probe --help  # exit 0
grok --append-system-prompt doc-probe --help  # exit 0
grok --system-prompt doc-probe --help  # exit 0
grok --allowedTools read --help  # exit 0
grok --disallowedTools write --help  # exit 0
grok login --legacy --help  # exit 0
grok login --oidc --help  # exit 0
grok update --enterprise --help  # exit 0
grok update --trigger user_command --help  # exit 0
grok update --auto --help  # exit 0
grok mcp add doc-probe --command echo --help  # exit 0
grok mcp add doc-probe --command echo --args probe --help  # exit 0
grok mcp add doc-probe --url https://example.invalid --help  # exit 0
grok mcp add doc-probe --url https://example.invalid --type http --help  # exit 0
```

### 条件编译与动态范围

源码还定义 `--chat` 相关构建能力、`--local-workspace` / `--local-workspace-attach` / `--local-workspace-cwd`、条件编译登录路径等，是否存在取决于构建特性；不能仅凭不同提交源码把它们加入本机支持列表。隐藏 `workspace` 的命令帮助存在，实际使用另有账号/feature 条件。插件、skills、远程配置和 ACP 后端可以添加会话命令，静态 CLI 帮助无法穷尽动态集合。

## 会话命令与 Goal

以下完整保留本地源码用户指南 `crates/codegen/xai-grok-pager/docs/user-guide/04-slash-commands.md` 的会话命令章节，commit 为 `07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8`。这些是**源码版本说明，不是本机逐条执行结果**。同一菜单混合 pager 命令、shell 命令和动态 skills；不能把任意 `/command` 放到 `--prompt-file` 后就视作已接入。相对链接改为同提交源码链接。

### Session Management

#### `/new`

Start a fresh session and clear the current conversation. Alias: `/clear`.

#### `/resume`

Open the session picker to reload a previous session from disk.

#### `/dashboard`

Open the [Agent Dashboard](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/docs/user-guide/23-dashboard.md): live roster of top-level sessions in this pager (peek, reply, dispatch, pin, rename, stop, attach). Aliases: `/agents-dashboard`, `/sessions`.

Not `/config-agents` (alias `/agents`), which manages agent *definitions* and personas. Hidden in minimal mode; disable with `GROK_AGENT_DASHBOARD=0` or `[dashboard].enabled = false`.

#### `/compact [context]`

Compress conversation history to reclaim context-window space. Pass a note to tell Grok what to keep:

```
/compact
/compact keep the auth implementation details
```

Grok also auto-compacts once the context window hits 85% (tune it with `[session] auto_compact_threshold_percent`).

#### `/context`

Show how the context window is being used: a category breakdown (system prompt, messages, reasoning and overhead, free space) plus informational rows for tool definitions, the skills listing, and MCP server announcements with their estimated token cost.

#### `/session-info`

Show session details — auth method, model, turn count, and context usage. Aliases: `/status`, `/info`. Click a value or drag to select and copy; `c` copies the session ID and `y` copies the whole block.

#### `/fork`

Branch the current session into a new agent, keeping history up to this point.

#### `/rewind` (alias: `/undo`)

Roll the conversation back to an earlier turn and discard everything after it. `/undo` is the same command.

#### `/copy`

Copy the most recent response's source markdown to the clipboard. Pass a number to copy the Nth-latest response instead, or a file path to write the text to a file rather than the clipboard (handy over SSH, where the local clipboard is often unreachable).

```
/copy
/copy 2
/copy out.txt
/copy 2 ~/exports/last-reply.md
```

Every copy is also written to a backup file — `~/.grok/last-copy.txt` by default, or `GROK_COPY_FILE` if set. Confirmed copies toast briefly (e.g. `Copied!`). Unverified OSC 52 deliveries and clipboard-unreachable fallbacks name the backup path so you can recover the text.

#### `/export`

Export the conversation to a file or the clipboard.

#### `/quit`

Quit the application. Alias: `/exit`.

#### `/home`

Leave the current session and return to the welcome screen. Alias: `/welcome`.

#### `/delete`

Delete the current session's history. Confirms first. Stops any running turn, background tasks, and subagents before wiping history. Returns to the welcome screen, or to the dashboard when you opened the session from the dashboard.

To delete a session you are not in, open `/resume` or the welcome session list and press `d` then `y`. On the dashboard, press `Ctrl+X` twice or click `[✗]`.

#### `/rename`

Rename the current session. Alias: `/title`.

```
/rename new session title
/rename --auto
```

`--auto` unpins a manual title and lets auto-titling resume. It applies to Build sessions only — chat conversations have no local auto-titler. It must be the only argument (`/rename --auto Something` is an error). A session cannot be named `--auto` via this command; use the dashboard rename editor (`Ctrl+R`) for that pathological case.

---

### Model and Mode

#### `/model <name>`

Switch models. Accepts a model ID or display name (case-insensitive), and for reasoning models you can add an effort level as a second argument. Alias: `/m`.

```
/model grok-build
/model Grok Build
/model Reasoning X high
```

#### `/effort <level>`

Set reasoning effort on the **current** model without reselecting it. Levels are `low`, `medium`, `high`, and `xhigh`, and it only applies when the active model supports reasoning effort.

```
/effort high
```

#### `/always-approve` and `/auto`

Both are real toggles for the permission mode: they stay in the menu, and running the mode you're already in turns it back off.

| Command | When off | When already on |
|---|---|---|
| `/always-approve` | Skip all permission prompts | Back to ask |
| `/auto` | Classifier approves safe tools (dangerous ones may still prompt) | Back to ask |

Running one while the other is active switches modes — for example, `/auto` while always-approve is on switches to auto. `/auto` only appears when the auto permission-mode feature is enabled. You can also change mode with `Shift+Tab` (cycles Normal / Plan / Auto (when enabled) / Always-approve), `Ctrl+O`, or `/settings`.

#### `/multiline`

Toggle multiline input. When it's on, `Enter` inserts a newline and `Shift+Enter` (or `Alt+Enter`) sends the message. Mid-turn, a bare `Enter` on an empty composer still force-sends the top queued follow-up. Alias: `/ml`.

#### `/history`

Open prompt-history search: fuzzy-search this session's prompts newest-first, then press `Enter` or `Tab` to drop a match back into the prompt.

For quick recall, press `↑` on an empty prompt instead. With prompts queued, that moves focus into the queue pane, highlighting the last row; otherwise the panel opens with your most recent prompt already filled in, and `↑`/`↓` step through entries (each lands in the input), `↓` past the newest entry closes the panel, and typing edits the recalled prompt in place.

#### `/compact-mode`

Toggle compact display — less padding and tighter spacing for denser output.

#### `/vim-mode`

Toggle vim-style scrollback keys (`j`/`k`, `h`/`l`, `g`/`G`, `y`/`Y`, and so on). With it off (the default), a bare letter or `Shift+letter` in the scrollback just focuses the prompt and types the character. The setting persists to `[ui] vim_mode`.

#### `/edit-prompt`

Open an external editor for the prompt, in either render mode. Grok resolves `$VISUAL`, then `$EDITOR`, then `vi`; command values may include quoted arguments. Saving replaces the draft without sending it, and saving an empty file clears it. Typing `/edit-prompt` necessarily replaces the composer's contents, so the editor starts from an empty draft; to edit an **existing** draft, choose **Edit Prompt in External Editor** from the command palette (or press `Ctrl+G` in minimal mode), which preserves the text and refuses pasted, file-reference, or image chips without flattening them.

```
/edit-prompt
```

#### `/minimal` and `/fullscreen`

Switch the current session to the other render mode, in place. `/minimal` (offered while you're in fullscreen) switches to the experimental scrollback-native mode; `/fullscreen` (offered while you're in minimal; alias `/full`) switches back to standard fullscreen mode. The switch happens inside the running process — nothing restarts, so a running turn keeps streaming and your composer draft, queued prompts, and permission mode all carry over; a marker (committed line in minimal, toast in fullscreen) reminds you how to switch back. Both are session-scoped — they don't touch `config.toml` — and the `--minimal` / `--fullscreen` CLI flags are session-scoped the same way. To make plain `grok` open in a given mode by default, use `/settings` → **Default screen mode** or set `[ui] screen_mode`. (If the in-place transition misbehaves in an exotic terminal, `GROK_SCREEN_MODE_SWITCH=exec` restores the old behavior of relaunching the pager onto the same session.)

A handful of commands only work in one of the two modes, because the surface they drive doesn't exist in the other: `/find`, `/jump`, `/timeline`, `/theme`, `/tutorial`, and `/dashboard` are fullscreen-only, while `/expand` is minimal-only. (`/workflow runs` is different: it opens the run pane in fullscreen and degrades to a text overview in minimal rather than refusing.) Those are hidden from the command menu and the palette in the mode they can't run in. If you type one out anyway, Grok says why — and points you at whichever is actually useful. When the other mode is the only way to get it, that's the mode switch: `/theme isn't available in minimal mode (minimal renders with your terminal's own palette). Run /fullscreen to switch this session.` When this mode already does the job another way, it names that instead: `/expand isn't available in fullscreen mode: press Tab to focus the scrollback, then → on the block.` Everything else works in both. Note that `--no-alt-screen` still counts as fullscreen here, so it keeps the fullscreen-only commands.

#### `/plan`

Enter plan mode.

```
/plan [description]
```

#### `/view-plan`

Open a preview of the current saved plan. Aliases: `/show-plan`, `/plan-view`.

---

### Memory

`/flush`, `/dream`, and `/memory` require memory enabled through `GROK_MEMORY=1`, `[memory] enabled = true`, or managed remote settings; `/memory` also needs a configured memory backend. `/remember` is always available.

#### `/memory`

Browse, view, and manage saved memories. Pass `on` or `off` to enable or disable memory. Alias: `/mem`.

```
/memory
/memory off
```

#### `/flush`

Save the current session's knowledge to memory right now, triggering an LLM summary of the most important content. Reach for it before compaction, or any time you want to lock in context.

#### `/dream`

Run memory consolidation — merge session logs into organized topics.

#### `/remember`

Save a note to memory immediately, without waiting for an automatic summary.

```
/remember the staging deploy uses the eu-west cluster
```

---

### Hooks and Plugins

`/hooks`, `/plugins`, `/marketplace`, `/skills`, and `/workflows` all open the same extensions modal, each on its own tab.

#### `/hooks`

Open the extensions modal on the Hooks tab, where you can view loaded hooks, add or remove custom ones, and toggle them individually. The modal does not grant project trust — see [10-hooks.md](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/docs/user-guide/10-hooks.md) for the trust model.

The shell also advertises individual `/hooks-list`, `/hooks-trust`, `/hooks-add`, `/hooks-remove`, and `/hooks-untrust` commands; in the pager these are folded into the `/hooks` modal.

#### `/plugins`

Open the extensions modal on the Plugins tab to view installed plugins, install new ones from the marketplace, and manage trust.

The shell additionally supports subcommands (`/plugins list`, `/plugins install <source>`, `/plugins uninstall <name>`, `/plugins update`, `/plugins reload`). In the pager, the modal does the same work visually.

#### `/marketplace`

Open the extensions modal on the Marketplace tab to browse and install plugins.

#### `/skills`

Open the extensions modal on the Skills tab to view installed skills.

---

### Media Generation

#### `/imagine <description>`

Generate an image from a text description.

```
/imagine a golden sunset over a calm ocean with silhouetted palm trees
```

#### `/imagine-video <description>`

Generate a video from a text (or image) description. It plans shots, generates source images, and animates them with `image_to_video`.

```
/imagine-video a cat playing piano in a jazz club
```

---

### Scheduling

#### `/loop [interval] <prompt>`

Run a prompt on a recurring interval. Give the interval as `30m`, `1 hour`, or `every 2 days`; leave it out and Grok will ask.

```
/loop 30m check deploy status
/loop check deploy status every hour
```

Intervals are `Ns` (seconds, minimum 60), `Nm` (minutes), `Nh` (hours), or `Nd` (days); anything under 60 seconds is raised to the minimum. Recurring tasks expire after 7 days, and you can cancel one with `scheduler_delete` using the job ID reported when the loop is created.

---

### Workflows and Goals

#### `/goal`

Set, manage, or check an autonomous goal. Grok works across rounds and only marks the goal complete after an independent evidence review confirms the claim; if that review can't reproduce the result or has no usable evidence, the goal stays active or pauses with concrete gaps.

```
/goal Migrate the auth module to the new API
/goal status
/goal pause
/goal resume
/goal clear
```

Arguments are `<objective> [--budget <tokens>]`, or one of `status`, `pause`, `resume`, `clear`. The `--budget` here is a **token** budget for the goal run, separate from the agent-count budgets that workflows use. `/goal` appears when goal mode is enabled for the session. Which driver runs it depends on background workflows: with them on, the host evaluates each model round and runs adversarial verification on completion candidates; with them off, the legacy model-facing `update_goal` path reports progress and triggers verification.

#### `/deep-research <query>`

Kick off a background research workflow. It plans a bounded set of questions, gathers structured claims with source evidence, cross-checks each claim on an independent verifier shard, and renders only the claims that survive, with their verified source locators. Failed shards, dropped claims, and researcher uncertainties are reported as coverage limitations, and the report is marked **Partial** whenever any remain.

```
/deep-research Compare the migration risks of PostgreSQL 17 and MySQL 9
```

The command returns right away — follow progress in `/workflow runs`, and the final report appears in the conversation on its own.

Workflows use an absolute cumulative `agent_budget` cap on logical child-agent calls: every `agent()` call and every item in a `parallel()` panel spends one slot, while schema-correction retries don't. The default is 128, explicit values run 1–1,024, and a panel that would cross the remaining budget is rejected before any of its children launch. Model-launched workflows set `agent_budget` on the `workflow` tool; named slash launches accept `--agent-budget N` or an `agent_budget` field in their JSON args. Named launches can also set child reasoning effort with `--effort LEVEL` or JSON `effort`, without changing the current session's `/effort`; a child script's own `effort` option takes precedence. Separately, a host-configured cap (32 by default) bounds how many children run at a time per run; larger panels queue and still act as a barrier. `budget()` reports the cap as `total`, admitted calls as `spent`, `reserved` (always zero), and `remaining`.

#### `/workflow`

Launch a saved workflow, or manage a running one by its session-unique display name. Launch the same workflow twice and the display names are numbered (`review-changes`, `review-changes-2`); you never need the internal run IDs. Bare `/workflow` prints a text overview of this session's runs.

Type `/workflow` and a space to autocomplete saved workflow names (built-in, project, and user) plus the manage verbs `runs`, `pause`, `resume`, `stop`, and `save`. Picking a name fills it in and offers launch flags before you add args; it does not launch until you press Enter. `pause` / `resume` / `stop` / `save` then list this session's run handles — a bare `/workflow stop` does not pick a run.

```
/workflow review-changes --agent-budget 256 --effort high {"target":"origin/main...HEAD"}
/workflow review-changes {"target":"origin/main...HEAD","agent_budget":256,"effort":"high"}
/workflow runs
/workflow pause review-changes
/workflow resume review-changes
/workflow stop review-changes-2
/workflow save review-changes
```

`/workflow runs` opens the live **Workflow Runs** dashboard in the fullscreen TUI — active and retained runs, not a catalog of saved definitions. Each row shows the run's display name, phase, agent roster, progress, and result. Inside a run's detail view, `p` pauses, `r` resumes an ordinary pause, and `x` stops. Budget-limited runs can't bare-resume: `r` returns the shell's rejection (raise the cap with a model/tool resume that passes a higher `agent_budget`), while `x` still stops. `s` saves the run's script, but it's hidden for known built-ins and numbered duplicate handles — for those, choose a new unique `meta.name` and save the edited script explicitly. In minimal mode and non-TUI clients, `/workflow runs` prints the same text overview as bare `/workflow`.

Project workflows live in `.grok/workflows/*.rhai`; user workflows live in `~/.grok/workflows/*.rhai`. A same-process pause/resume continues the original immutable script, args, and `agent_budget` cap from committed host-call results — to iterate, edit the returned script copy and launch it as a new run.

A budget-limited run is different: it only resumes through a model/tool resume request that supplies an `agent_budget` above the admitted agent count. A bare `/workflow resume <name>` can't raise the cap, so it rejects budget-limited runs. Runs interrupted by a process restart aren't resumed at all, because external effects have no stable cross-process identity. And resume is not exactly-once: an external effect whose result wasn't committed before a same-process pause can run again.

#### `/workflows`

Open the extensions modal on the **Workflows** tab — a browse-only catalog of the saved workflows Grok discovered (built-ins, project `.grok/workflows/`, and user `~/.grok/workflows/`), with each entry's source, description, and path. The same catalog is listed for the model under the skill listing in the session preamble. Launch one with `/workflow <name>` (or its own slash command), then watch it in `/workflow runs`.

---

### Other

#### `/theme`

Switch the color theme. Alias: `/t`.

#### `/feedback [message]`

Report an issue or send feedback. Opens a report pane: `Enter` sends, `Esc` discards. A message prefills the pane so you can edit before sending. In `--minimal`, a message still sends immediately.

```
/feedback
/feedback Something isn't working correctly
```

#### `/btw`

Send an aside to the agent without interrupting the current task. In minimal mode (`--minimal`), the answer shows up in a dismissible panel above the prompt: `Esc` dismisses it, a finished answer is saved into native scrollback, and a late reply to an already-dismissed panel is dropped. The side question and its answer aren't part of the main turn.

```
/btw also check the error handling
```

#### `/mcps`

Open the MCP servers management modal.

#### `/doctor`

Check the current session for terminal, clipboard, color, input, notification, and sandbox issues. Doctor shows what it found and how to resolve each issue. Run `/doctor fix` to list available automatic fixes; other findings include manual steps. `/terminal-setup`, `/terminal-check`, and `/terminal-info` remain aliases.

#### `/release-notes`

View release notes for the current version. Alias: `/changelog`.

#### `/docs`

Browse the built-in How-to Guides, open the online Build docs, or jump straight to a guide by title. Aliases: `/howto`, `/guides`.

```
/docs
/docs web
/docs Getting Started
```

- Bare `/docs` (or `/docs how-to`) opens the How-to Guides picker.
- `/docs web` opens https://docs.x.ai/build/overview in your browser.
- `/docs <title>` opens a specific guide by case-insensitive title match.

#### `/tutorial`

Open the onboarding tutorial: a short list of topics (your first prompt, attaching context, navigation, slash commands, worktrees, plan mode, customization, switching from another agent tool) — each a ~30-second read, with `→` flowing straight to the next topic. Nothing auto-shows — this command (or the command palette) is the way in.

```
/tutorial
```

Aliases: `/tour`, `/onboarding`

#### `/import-claude`

Open the Claude import modal to bring over `~/.claude` settings: permissions, environment variables, MCP servers, hooks, and paths.

---

### Agents and Personas

#### `/config-agents`

Open the agents modal to view and manage agent definitions, set the default, and switch the active one. Alias: `/agents`.

Not the live multi-session [Agent Dashboard](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/docs/user-guide/23-dashboard.md) (`/dashboard` / `Ctrl+\`).

#### `/personas`

Create, edit, and delete personas. A subagent can apply a persona to shape how it behaves.

---

### Account and Billing

#### `/login`

Log in or re-authenticate without leaving the session.

#### `/logout`

Log out and return to the login screen.

#### `/usage`

View credit usage or manage billing. Alias: `/cost`.

```
/usage
/usage manage
```

#### `/privacy`

Open Settings on **Coding data, retention, and training**, where you choose
**Opt in** or **Opt out**. Takes no arguments.

```
/privacy
```

This setting doesn't touch `[features] telemetry`, `trace_upload`, or your external OTEL settings — see [Monitoring Usage](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/docs/user-guide/24-monitoring-usage.md#related-settings). On team accounts only a team admin can change it, and admins can also enable or disable Zero Data Retention for the team ([how to enable ZDR](https://docs.x.ai/developers/faq/security#how-to-enable-zdr)). When the choice isn't yours to make, the row says so — `ZDR` or `· Admin Managed` — instead of opening the chooser.

---

### Configuration and UI

#### `/settings`

Open the settings modal to view and change configuration interactively. Aliases: `/config`, `/preferences`, `/prefs`.

#### `/timestamps`

Toggle message timestamps on or off.

---

### Skills as Slash Commands

Any enabled skill with `user-invocable: true` in its SKILL.md frontmatter shows up as a slash command. (Turn a skill off via `/skills` and it stops being advertised.) So a skill at `~/.grok/skills/commit/SKILL.md` runs as:

```
/commit fix typo in README
```

Skills from plugins work the same way. When two skills share a name across scopes, qualify it:

```
/local:commit      # Project-scoped skill
/user:commit       # User-scoped skill
```

Built-in commands always win the bare name. Name a skill "compact" and `/compact` still runs the built-in — the skill stays available as `/local:compact` (or `/acme:compact` for a plugin). Both appear in the slash menu: the built-in is tagged `built-in` and the skill is tagged `skill · local` / `skill · acme`.

---

### Autocomplete

The menu supports fuzzy search: start typing after `/` to filter. Each entry shows the command name, its description, an argument hint when it takes arguments, and its source (builtin, skill scope, or plugin name). Press `Tab` or `Enter` to accept the highlighted command.


### Goal 的参数边界

官方已经发布 [Grok `/goal`](https://x.ai/news/introducing-goal)。本地上述源码指南的具体语法：

```text
/goal <objective> [--budget <tokens>]
/goal status
/goal pause
/goal resume
/goal clear
```

这里的 budget 是 token 预算，不是 `--max-turns` 或 runner 的 `timeout_ms`。Goal 需要 session 启用对应功能；源码说明完成候选经过独立证据检查。未以本机1.0.13执行真实 headless goal，本仓库也没有 goal 字段、状态控制或完成事件解析。根帮助未列出 `--goal`，不能创造一个同名 CLI 参数。

## 更新与交叉核验

- [README：本仓库接入情况](README.md)
- [官方 CLI 参考](https://docs.x.ai/build/cli/reference)：官方明确完整集合需查看本机各级 `--help`。
- [官方模式和会话命令](https://docs.x.ai/build/modes-and-commands)：持续更新，与本机交付版本可能不同。
- [官方源码 CLI 定义](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/src/app/cli.rs)
- [同提交 MCP 参数定义](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/src/mcp_cmd.rs)
- [同提交会话命令指南](https://github.com/xai-org/grok-build/blob/07b2f7144fd5c5c9d3dd1966937a87852d2dbdb8/crates/codegen/xai-grok-pager/docs/user-guide/04-slash-commands.md)

升级时重新记录版本，递归采集 Commands 区段列出的所有主命令及叶子帮助，核对隐藏命令/参数解析后再更新本页。帮助采集与参数解析均没有启动模型任务、读取账号凭据、提交对外内容或运行命令的实际变更操作。
