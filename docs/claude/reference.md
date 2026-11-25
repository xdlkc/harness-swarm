# claude 命令与参数参考

格式说明：帮助快照保留完整参数文本，仅去除终端控制字符与行末空白。

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。

采集日期：2026-09-15（Asia/Shanghai）。版本：`2.1.177 (Claude Code)`。
- 可执行入口：`~/.local/bin/claude`
- 解析后路径：`~/.local/share/claude/versions/2.1.177`
- 版本命令：`claude --version`
- 平台：macOS；其他平台的条件命令不属于本机帮助快照。
## 范围与证据
以下完整收录本机根帮助和递归公开子命令帮助，并补充已经发现的隐藏入口，共 **45 个帮助采集节点**。每节注明实际执行命令和退出码；帮助返回成功只证明该帮助入口可读，不证明凭据、模型调用或对应操作执行成功。
仅执行版本和帮助查询，没有执行登录、安装、更新、删除、模型任务或云端调度。别名以父级帮助中列出的名称为准，不重复复制同一命令帮助。`help [command ...]` 是帮助导航，可用各节点 `--help` 获取相同信息；不把它递归展开为无限组合。`[x]` 表示可选，`<x>` 表示值或位置参数，`...` 表示可重复，具体默认值、枚举及限制保留在原始输出中。
这里的“全部参数”指版本化 CLI 帮助公开的完整参数面，另附已找到的隐藏参数。扩展/插件自定义命令、账号开关控制的入口及未公开内部协议无法仅靠 `--help` 穷尽；配置文件键、环境变量和会话内 `/` 命令另列来源，不冒充 CLI flags。
## 命令索引
- [claude](#cmd-0)
- [claude agents](#cmd-1)
- [claude auth](#cmd-2)
- [claude auto-mode](#cmd-3)
- [claude doctor](#cmd-4)
- [claude install](#cmd-5)
- [claude mcp](#cmd-6)
- [claude plugin](#cmd-7)
- [claude project](#cmd-8)
- [claude setup-token](#cmd-9)
- [claude ultrareview](#cmd-10)
- [claude update](#cmd-11)
- [claude auth login](#cmd-12)
- [claude auth logout](#cmd-13)
- [claude auth status](#cmd-14)
- [claude auto-mode config](#cmd-15)
- [claude auto-mode critique](#cmd-16)
- [claude auto-mode defaults](#cmd-17)
- [claude mcp add](#cmd-18)
- [claude mcp add-from-claude-desktop](#cmd-19)
- [claude mcp add-json](#cmd-20)
- [claude mcp get](#cmd-21)
- [claude mcp list](#cmd-22)
- [claude mcp remove](#cmd-23)
- [claude mcp reset-project-choices](#cmd-24)
- [claude mcp serve](#cmd-25)
- [claude plugin details](#cmd-26)
- [claude plugin disable](#cmd-27)
- [claude plugin enable](#cmd-28)
- [claude plugin init](#cmd-29)
- [claude plugin install](#cmd-30)
- [claude plugin list](#cmd-31)
- [claude plugin marketplace](#cmd-32)
- [claude plugin prune](#cmd-33)
- [claude plugin tag](#cmd-34)
- [claude plugin uninstall](#cmd-35)
- [claude plugin update](#cmd-36)
- [claude plugin validate](#cmd-37)
- [claude project purge](#cmd-38)
- [claude plugin marketplace add](#cmd-39)
- [claude plugin marketplace list](#cmd-40)
- [claude plugin marketplace remove](#cmd-41)
- [claude plugin marketplace update](#cmd-42)
- [claude remote-control](#cmd-43)（补充入口）
- [claude import-conversations](#cmd-44)（补充入口）

## 原始帮助快照

<a id="cmd-0"></a>

### `claude`
采集：`claude --help`；退出码：`0`。

````text
Usage: claude [options] [command] [prompt]

Claude Code - starts an interactive session by default, use -p/--print for
non-interactive output

Arguments:
  prompt                                Your prompt

Options:
  --add-dir <directories...>            Additional directories to allow tool
                                        access to
  --agent <agent>                       Agent for the current session. Overrides
                                        the 'agent' setting.
  --agents <json>                       JSON object defining custom agents (e.g.
                                        '{"reviewer": {"description": "Reviews
                                        code", "prompt": "You are a code
                                        reviewer"}}')
  --allow-dangerously-skip-permissions  Enable bypassing all permission checks
                                        as an option, without it being enabled
                                        by default. Recommended only for
                                        sandboxes with no internet access.
  --allowedTools, --allowed-tools <tools...>
      Comma or space-separated list of tool names to allow (e.g. "Bash(git *)
      Edit")
  --append-system-prompt <prompt>       Append a system prompt to the default
                                        system prompt
  --bare                                Minimal mode: skip hooks, LSP, plugin
                                        sync, attribution, auto-memory,
                                        background prefetches, keychain reads,
                                        and CLAUDE.md auto-discovery. Sets
                                        CLAUDE_CODE_SIMPLE=1. Anthropic auth is
                                        strictly ANTHROPIC_API_KEY or
                                        apiKeyHelper via --settings (OAuth and
                                        keychain are never read). 3P providers
                                        (Bedrock/Vertex/Foundry) use their own
                                        credentials. Skills still resolve via
                                        /skill-name. Explicitly provide context
                                        via: --system-prompt[-file],
                                        --append-system-prompt[-file], --add-dir
                                        (CLAUDE.md dirs), --mcp-config,
                                        --settings, --agents, --plugin-dir.
  --betas <betas...>                    Beta headers to include in API requests
                                        (API key users only)
  --brief                               Enable SendUserMessage tool for
                                        agent-to-user communication
  --chrome                              Enable Claude in Chrome integration
  -c, --continue                        Continue the most recent conversation in
                                        the current directory
  --dangerously-skip-permissions        Bypass all permission checks.
                                        Recommended only for sandboxes with no
                                        internet access.
  -d, --debug [filter]                  Enable debug mode with optional category
                                        filtering (e.g., "api,hooks" or
                                        "!1p,!file")
  --debug-file <path>                   Write debug logs to a specific file path
                                        (implicitly enables debug mode)
  --disable-slash-commands              Disable all skills
  --disallowedTools, --disallowed-tools <tools...>
      Comma or space-separated list of tool names to deny (e.g. "Bash(git *)
      Edit")
  --effort <level>                      Effort level for the current session
                                        (low, medium, high, xhigh, max)
  --exclude-dynamic-system-prompt-sections
      Move per-machine sections (cwd, env info, memory paths, git status) from
      the system prompt into the first user message. Improves cross-user
      prompt-cache reuse. Only applies with the default system prompt (ignored
      with --system-prompt). (default: false)
  --fallback-model <model>              Enable automatic fallback to specified
                                        model(s) when the default model is
                                        overloaded or not available. Accepts a
                                        comma-separated list to try each in
                                        order. Re-tries the primary at the start
                                        of each user turn. (only works with
                                        --print)
  --file <specs...>                     File resources to download at startup.
                                        Format: file_id:relative_path (e.g.,
                                        --file file_abc:doc.txt
                                        file_def:img.png)
  --fork-session                        When resuming, create a new session ID
                                        instead of reusing the original (use
                                        with --resume or --continue)
  --from-pr [value]                     Resume a session linked to a PR by PR
                                        number/URL, or open interactive picker
                                        with optional search term
  -h, --help                            Display help for command
  --ide                                 Automatically connect to IDE on startup
                                        if exactly one valid IDE is available
  --include-hook-events                 Include all hook lifecycle events in the
                                        output stream (only works with
                                        --output-format=stream-json)
  --include-partial-messages            Include partial message chunks as they
                                        arrive (only works with --print and
                                        --output-format=stream-json)
  --input-format <format>               Input format (only works with --print):
                                        "text" (default), or "stream-json"
                                        (realtime streaming input) (choices:
                                        "text", "stream-json")
  --json-schema <schema>                JSON Schema for structured output
                                        validation. Example:
                                        {"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}
  --max-budget-usd <amount>             Maximum dollar amount to spend on API
                                        calls (only works with --print)
  --mcp-config <configs...>             Load MCP servers from JSON files or
                                        strings (space-separated)
  --mcp-debug                           [DEPRECATED. Use --debug instead] Enable
                                        MCP debug mode (shows MCP server errors)
  --model <model>                       Model for the current session. Provide
                                        an alias for the latest model (e.g.
                                        'fable', 'opus', or 'sonnet') or a
                                        model's full name (e.g.
                                        'claude-fable-5').
  -n, --name <name>                     Set a display name for this session
                                        (shown in the prompt box, /resume
                                        picker, and terminal title)
  --no-chrome                           Disable Claude in Chrome integration
  --no-session-persistence              Disable session persistence - sessions
                                        will not be saved to disk and cannot be
                                        resumed (only works with --print)
  --output-format <format>              Output format (only works with --print):
                                        "text" (default), "json" (single
                                        result), or "stream-json" (realtime
                                        streaming) (choices: "text", "json",
                                        "stream-json")
  --permission-mode <mode>              Permission mode to use for the session
                                        (choices: "acceptEdits", "auto",
                                        "bypassPermissions", "default",
                                        "dontAsk", "plan")
  --plugin-dir <path>                   Load a plugin from a directory or .zip
                                        for this session only (repeatable:
                                        --plugin-dir A --plugin-dir B.zip)
                                        (default: [])
  --plugin-url <url>                    Fetch a plugin .zip from a URL for this
                                        session only (repeatable: --plugin-url A
                                        --plugin-url B) (default: [])
  -p, --print                           Print response and exit (useful for
                                        pipes). Note: The workspace trust dialog
                                        is skipped when Claude is run in
                                        non-interactive mode (via -p, or when
                                        stdout is not a TTY, e.g. piped or
                                        redirected output). Only use this in
                                        directories you trust. Settings files
                                        that fail validation are silently
                                        ignored in this mode (no error dialog is
                                        shown).
  --prompt-suggestions [value]          Enable prompt suggestions. In print/SDK
                                        mode, emits a prompt_suggestion message
                                        after each turn with a predicted next
                                        user prompt (choices: "true", "false",
                                        "1", "0", "yes", "no", "on", "off",
                                        preset: "true")
  --remote-control [name]               Start an interactive session with Remote
                                        Control enabled (optionally named)
  --remote-control-session-name-prefix <prefix>
      Prefix for auto-generated Remote Control session names (default: hostname)
  --replay-user-messages                Re-emit user messages from stdin back on
                                        stdout for acknowledgment (only works
                                        with --input-format=stream-json and
                                        --output-format=stream-json)
  -r, --resume [value]                  Resume a conversation by session ID, or
                                        open interactive picker with optional
                                        search term
  --safe-mode                           Start with all customizations
                                        (CLAUDE.md, skills, plugins, hooks, MCP
                                        servers, custom commands and agents,
                                        output styles, workflows, custom themes,
                                        keybindings, and more) disabled — useful
                                        for troubleshooting a broken
                                        configuration. Admin-managed (policy)
                                        settings still apply. Auth, model
                                        selection, built-in tools, and
                                        permissions work normally. Sets
                                        CLAUDE_CODE_SAFE_MODE=1.
  --session-id <uuid>                   Use a specific session ID for the
                                        conversation (must be a valid UUID)
  --setting-sources <sources>           Comma-separated list of setting sources
                                        to load (user, project, local).
  --settings <file-or-json>             Path to a settings JSON file or a JSON
                                        string to load additional settings from
  --strict-mcp-config                   Only use MCP servers from --mcp-config,
                                        ignoring all other MCP configurations
  --system-prompt <prompt>              System prompt to use for the session
  --tmux                                Create a tmux session for the worktree
                                        (requires --worktree). Uses iTerm2
                                        native panes when available; use
                                        --tmux=classic for traditional tmux.
  --tools <tools...>                    Specify the list of available tools from
                                        the built-in set. Use "" to disable all
                                        tools, "default" to use all tools, or
                                        specify tool names (e.g.
                                        "Bash,Edit,Read").
  --verbose                             Override verbose mode setting from
                                        config
  -v, --version                         Output the version number
  -w, --worktree [name]                 Create a new git worktree for this
                                        session (optionally specify a name)

Commands:
  agents [options]                      Manage background agents
  auth                                  Manage authentication
  auto-mode                             Inspect auto mode classifier
                                        configuration
  doctor                                Check the health of your Claude Code
                                        auto-updater. Note: The workspace trust
                                        dialog is skipped and stdio servers from
                                        .mcp.json are spawned for health checks.
                                        Only use this command in directories you
                                        trust.
  install [options] [target]            Install Claude Code native build. Use
                                        [target] to specify version (stable,
                                        latest, or specific version)
  mcp                                   Configure and manage MCP servers
  plugin|plugins                        Manage Claude Code plugins
  project                               Manage Claude Code project state
  setup-token                           Set up a long-lived authentication token
                                        (requires Claude subscription)
  ultrareview [options] [target]        Run a cloud-hosted multi-agent code
                                        review of the current branch (or a PR
                                        number / base branch) and print the
                                        findings
  update|upgrade                        Check for updates and install if
                                        available
````

<a id="cmd-1"></a>

### `claude agents`
采集：`claude agents --help`；退出码：`0`。

````text
Usage: claude agents [options]

Manage background agents

Options:
  --add-dir <directory>                 Additional directory to allow tool
                                        access to in dispatched sessions
                                        (repeatable)
  --agent <agent>                       Default agent for sessions dispatched
                                        from agent view. Overrides the 'agent'
                                        setting.
  --all                                 With --json: include completed sessions
                                        (the full agent view list)
  --allow-dangerously-skip-permissions  Make bypass-permissions mode available
                                        to dispatched sessions without
                                        defaulting to it
  --cwd <path>                          Show only background sessions started
                                        under <path>
  --dangerously-skip-permissions        Alias for --permission-mode
                                        bypassPermissions
  --effort <level>                      Default effort level for sessions
                                        dispatched from agent view
  -h, --help                            Display help for command
  --json                                Print active sessions as a JSON array
                                        and exit (for scripting; does not
                                        require a TTY)
  --mcp-config <config>                 MCP server configuration to apply to
                                        dispatched sessions (repeatable)
  --model <model>                       Default model for sessions dispatched
                                        from agent view
  --permission-mode <mode>              Default permission mode for sessions
                                        dispatched from agent view
  --plugin-dir <path>                   Load plugins from specified directory
                                        for the agent view and dispatched
                                        sessions (repeatable)
  --setting-sources <sources>           Comma-separated list of setting sources
                                        to load (user, project, local).
  --settings <file-or-json>             Settings file or JSON string to apply to
                                        the agent view and dispatched sessions
  --strict-mcp-config                   Only use MCP servers from --mcp-config
                                        in dispatched sessions
````

<a id="cmd-2"></a>

### `claude auth`
采集：`claude auth --help`；退出码：`0`。

````text
Usage: claude auth [options] [command]

Manage authentication

Options:
  -h, --help        Display help for command

Commands:
  help [command]    display help for command
  login [options]   Sign in to your Anthropic account
  logout            Log out from your Anthropic account
  status [options]  Show authentication status
````

<a id="cmd-3"></a>

### `claude auto-mode`
采集：`claude auto-mode --help`；退出码：`0`。

````text
Usage: claude auto-mode [options] [command]

Inspect auto mode classifier configuration

Options:
  -h, --help          Display help for command

Commands:
  config              Print the effective auto mode config as JSON: your
                      settings where set, defaults otherwise
  critique [options]  Get AI feedback on your custom auto mode rules
  defaults            Print the default auto mode environment, allow, soft_deny,
                      and hard_deny rules as JSON
  help [command]      display help for command
````

<a id="cmd-4"></a>

### `claude doctor`
采集：`claude doctor --help`；退出码：`0`。

````text
Usage: claude doctor [options]

Check the health of your Claude Code auto-updater. Note: The workspace trust
dialog is skipped and stdio servers from .mcp.json are spawned for health
checks. Only use this command in directories you trust.

Options:
  -h, --help  Display help for command
````

<a id="cmd-5"></a>

### `claude install`
采集：`claude install --help`；退出码：`0`。

````text
Usage: claude install [options] [target]

Install Claude Code native build. Use [target] to specify version (stable,
latest, or specific version)

Options:
  --force     Force installation even if already installed
  -h, --help  Display help for command
````

<a id="cmd-6"></a>

### `claude mcp`
采集：`claude mcp --help`；退出码：`0`。

````text
Usage: claude mcp [options] [command]

Configure and manage MCP servers

Options:
  -h, --help                            Display help for command

Commands:
  add [options] <name> <commandOrUrl> [args...]  Add an MCP server to Claude Code.

  Examples:
    # Add HTTP server:
    claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

    # Add HTTP server with headers:
    claude mcp add --transport http corridor https://app.corridor.dev/api/mcp --header "Authorization: Bearer ..."

    # Add stdio server with environment variables:
    claude mcp add my-server -e API_KEY=xxx -- npx my-mcp-server

    # Add stdio server with subprocess flags:
    claude mcp add my-server -- my-command --some-flag arg1
  add-from-claude-desktop [options]     Import MCP servers from Claude Desktop
                                        (Mac and WSL only)
  add-json [options] <name> <json>      Add an MCP server (stdio or SSE) with a
                                        JSON string
  get <name>                            Get details about an MCP server.
                                        Unapproved .mcp.json servers are shown
                                        as ⏸ Pending approval and not connected
                                        to; approved servers are health-checked.
  help [command]                        display help for command
  list                                  List configured MCP servers. Unapproved
                                        .mcp.json servers are shown as ⏸ Pending
                                        approval and not connected to; approved
                                        servers are health-checked.
  remove [options] <name>               Remove an MCP server
  reset-project-choices                 Reset all approved and rejected
                                        project-scoped (.mcp.json) servers
                                        within this project
  serve [options]                       Start the Claude Code MCP server
````

<a id="cmd-7"></a>

### `claude plugin`
采集：`claude plugin --help`；退出码：`0`。

````text
Usage: claude plugin|plugins [options] [command]

Manage Claude Code plugins

Options:
  -h, --help                           Display help for command

Commands:
  details [options] <name>             Show a plugin's component inventory and
                                       projected token cost
  disable [options] [plugin]           Disable an enabled plugin
  enable [options] <plugin>            Enable a disabled plugin
  help [command]                       display help for command
  init|new [options] <name>            Scaffold a new plugin at
                                       ~/.claude/skills/<name>/ (auto-loads next
                                       session as <name>@skills-dir)
  install|i [options] <plugin>         Install a plugin from available
                                       marketplaces (use plugin@marketplace for
                                       specific marketplace)
  list [options]                       List installed plugins
  marketplace                          Manage Claude Code marketplaces
  prune|autoremove [options]           Remove auto-installed dependencies that
                                       are no longer needed
  tag [options] [path]                 Create a {name}--v{version} git tag for a
                                       plugin release, validating that
                                       plugin.json and any enclosing marketplace
                                       entry agree
  uninstall|remove [options] <plugin>  Uninstall an installed plugin
  update [options] <plugin>            Update a plugin to the latest version
                                       (restart required to apply)
  validate [options] <path>            Validate a plugin or marketplace manifest
````

<a id="cmd-8"></a>

### `claude project`
采集：`claude project --help`；退出码：`0`。

````text
Usage: claude project [options] [command]

Manage Claude Code project state

Options:
  -h, --help              Display help for command

Commands:
  help [command]          display help for command
  purge [options] [path]  Delete all Claude Code state for a project
                          (transcripts, tasks, file history, config entry)
````

<a id="cmd-9"></a>

### `claude setup-token`
采集：`claude setup-token --help`；退出码：`0`。

````text
Usage: claude setup-token [options]

Set up a long-lived authentication token (requires Claude subscription)

Options:
  -h, --help  Display help for command
````

<a id="cmd-10"></a>

### `claude ultrareview`
采集：`claude ultrareview --help`；退出码：`0`。

````text
Usage: claude ultrareview [options] [target]

Run a cloud-hosted multi-agent code review of the current branch (or a PR number
/ base branch) and print the findings

Options:
  -h, --help           Display help for command
  --json               Print the raw bugs.json payload instead of formatted
                       findings
  --timeout <minutes>  Maximum minutes to wait for the review to finish
                       (default: 30)
````

<a id="cmd-11"></a>

### `claude update`
采集：`claude update --help`；退出码：`0`。

````text
Usage: claude update|upgrade [options]

Check for updates and install if available

Options:
  -h, --help  Display help for command
````

<a id="cmd-12"></a>

### `claude auth login`
采集：`claude auth login --help`；退出码：`0`。

````text
Usage: claude auth login [options]

Sign in to your Anthropic account

Options:
  --claudeai       Use Claude subscription (default)
  --console        Use Anthropic Console (API usage billing) instead of Claude
                   subscription
  --email <email>  Pre-populate email address on the login page
  -h, --help       Display help for command
  --sso            Force SSO login flow
````

<a id="cmd-13"></a>

### `claude auth logout`
采集：`claude auth logout --help`；退出码：`0`。

````text
Usage: claude auth logout [options]

Log out from your Anthropic account

Options:
  -h, --help  Display help for command
````

<a id="cmd-14"></a>

### `claude auth status`
采集：`claude auth status --help`；退出码：`0`。

````text
Usage: claude auth status [options]

Show authentication status

Options:
  -h, --help  Display help for command
  --json      Output as JSON (default)
  --text      Output as human-readable text
````

<a id="cmd-15"></a>

### `claude auto-mode config`
采集：`claude auto-mode config --help`；退出码：`0`。

````text
Usage: claude auto-mode config [options]

Print the effective auto mode config as JSON: your settings where set, defaults
otherwise

Options:
  -h, --help  Display help for command
````

<a id="cmd-16"></a>

### `claude auto-mode critique`
采集：`claude auto-mode critique --help`；退出码：`0`。

````text
Usage: claude auto-mode critique [options]

Get AI feedback on your custom auto mode rules

Options:
  -h, --help       Display help for command
  --model <model>  Override which model is used
````

<a id="cmd-17"></a>

### `claude auto-mode defaults`
采集：`claude auto-mode defaults --help`；退出码：`0`。

````text
Usage: claude auto-mode defaults [options]

Print the default auto mode environment, allow, soft_deny, and hard_deny rules
as JSON

Options:
  -h, --help  Display help for command
````

<a id="cmd-18"></a>

### `claude mcp add`
采集：`claude mcp add --help`；退出码：`0`。

````text
Usage: claude mcp add [options] <name> <commandOrUrl> [args...]

Add an MCP server to Claude Code.

Examples:
  # Add HTTP server:
  claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

  # Add HTTP server with headers:
  claude mcp add --transport http corridor https://app.corridor.dev/api/mcp
--header "Authorization: Bearer ..."

  # Add stdio server with environment variables:
  claude mcp add my-server -e API_KEY=xxx -- npx my-mcp-server

  # Add stdio server with subprocess flags:
  claude mcp add my-server -- my-command --some-flag arg1

Options:
  --callback-port <port>       Fixed port for OAuth callback (for servers
                               requiring pre-registered redirect URIs)
  --client-id <clientId>       OAuth client ID for HTTP/SSE servers
  --client-secret              Prompt for OAuth client secret (or set
                               MCP_CLIENT_SECRET env var)
  -e, --env <env...>           Set environment variables (e.g. -e KEY=value)
  -H, --header <header...>     Set WebSocket headers (e.g. -H "X-Api-Key:
                               abc123" -H "X-Custom: value")
  -h, --help                   Display help for command
  -s, --scope <scope>          Configuration scope (local, user, or project)
                               (default: "local")
  -t, --transport <transport>  Transport type (stdio, sse, http). Defaults to
                               stdio if not specified.
````

<a id="cmd-19"></a>

### `claude mcp add-from-claude-desktop`
采集：`claude mcp add-from-claude-desktop --help`；退出码：`0`。

````text
Usage: claude mcp add-from-claude-desktop [options]

Import MCP servers from Claude Desktop (Mac and WSL only)

Options:
  -h, --help           Display help for command
  -s, --scope <scope>  Configuration scope (local, user, or project) (default:
                       "local")
````

<a id="cmd-20"></a>

### `claude mcp add-json`
采集：`claude mcp add-json --help`；退出码：`0`。

````text
Usage: claude mcp add-json [options] <name> <json>

Add an MCP server (stdio or SSE) with a JSON string

Options:
  --client-secret      Prompt for OAuth client secret (or set MCP_CLIENT_SECRET
                       env var)
  -h, --help           Display help for command
  -s, --scope <scope>  Configuration scope (local, user, or project) (default:
                       "local")
````

<a id="cmd-21"></a>

### `claude mcp get`
采集：`claude mcp get --help`；退出码：`0`。

````text
Usage: claude mcp get [options] <name>

Get details about an MCP server. Unapproved .mcp.json servers are shown as ⏸
Pending approval and not connected to; approved servers are health-checked.

Options:
  -h, --help  Display help for command
````

<a id="cmd-22"></a>

### `claude mcp list`
采集：`claude mcp list --help`；退出码：`0`。

````text
Usage: claude mcp list [options]

List configured MCP servers. Unapproved .mcp.json servers are shown as ⏸ Pending
approval and not connected to; approved servers are health-checked.

Options:
  -h, --help  Display help for command
````

<a id="cmd-23"></a>

### `claude mcp remove`
采集：`claude mcp remove --help`；退出码：`0`。

````text
Usage: claude mcp remove [options] <name>

Remove an MCP server

Options:
  -h, --help           Display help for command
  -s, --scope <scope>  Configuration scope (local, user, or project) - if not
                       specified, removes from whichever scope it exists in
````

<a id="cmd-24"></a>

### `claude mcp reset-project-choices`
采集：`claude mcp reset-project-choices --help`；退出码：`0`。

````text
Usage: claude mcp reset-project-choices [options]

Reset all approved and rejected project-scoped (.mcp.json) servers within this
project

Options:
  -h, --help  Display help for command
````

<a id="cmd-25"></a>

### `claude mcp serve`
采集：`claude mcp serve --help`；退出码：`0`。

````text
Usage: claude mcp serve [options]

Start the Claude Code MCP server

Options:
  -d, --debug  Enable debug mode
  -h, --help   Display help for command
  --verbose    Override verbose mode setting from config
````

<a id="cmd-26"></a>

### `claude plugin details`
采集：`claude plugin details --help`；退出码：`0`。

````text
Usage: claude plugin details [options] <name>

Show a plugin's component inventory and projected token cost

Options:
  -h, --help  Display help for command
````

<a id="cmd-27"></a>

### `claude plugin disable`
采集：`claude plugin disable --help`；退出码：`0`。

````text
Usage: claude plugin disable [options] [plugin]

Disable an enabled plugin

Options:
  -a, --all            Disable all enabled plugins
  -h, --help           Display help for command
  -s, --scope <scope>  Installation scope: user, project, local (default:
                       auto-detect)
````

<a id="cmd-28"></a>

### `claude plugin enable`
采集：`claude plugin enable --help`；退出码：`0`。

````text
Usage: claude plugin enable [options] <plugin>

Enable a disabled plugin

Options:
  -h, --help           Display help for command
  -s, --scope <scope>  Installation scope: user, project, local (default:
                       auto-detect)
````

<a id="cmd-29"></a>

### `claude plugin init`
采集：`claude plugin init --help`；退出码：`0`。

````text
Usage: claude plugin init|new [options] <name>

Scaffold a new plugin at ~/.claude/skills/<name>/ (auto-loads next session as
<name>@skills-dir)

Options:
  --author <name>         Author name (default: git config user.name)
  --author-email <email>  Author email (default: git config user.email)
  --description <text>    Manifest description
  -f, --force             Overwrite an existing .claude-plugin/ at the target
  -h, --help              Display help for command
  --with <components...>  Also scaffold: skills, agents, hooks, mcp, lsp,
                          output-style, channel
````

<a id="cmd-30"></a>

### `claude plugin install`
采集：`claude plugin install --help`；退出码：`0`。

````text
Usage: claude plugin install|i [options] <plugin>

Install a plugin from available marketplaces (use plugin@marketplace for
specific marketplace)

Options:
  --config <key=value>  Set a userConfig option declared in the plugin's
                        manifest (repeatable). Values are validated against the
                        schema and stored via the same path as the interactive
                        /plugin configure flow.
  -h, --help            Display help for command
  -s, --scope <scope>   Installation scope: user, project, or local (default:
                        "user")
````

<a id="cmd-31"></a>

### `claude plugin list`
采集：`claude plugin list --help`；退出码：`0`。

````text
Usage: claude plugin list [options]

List installed plugins

Options:
  --available  Include available plugins from marketplaces (requires --json)
  -h, --help   Display help for command
  --json       Output as JSON
````

<a id="cmd-32"></a>

### `claude plugin marketplace`
采集：`claude plugin marketplace --help`；退出码：`0`。

````text
Usage: claude plugin marketplace [options] [command]

Manage Claude Code marketplaces

Options:
  -h, --help                  Display help for command

Commands:
  add [options] <source>      Add a marketplace from a URL, path, or GitHub repo
  help [command]              display help for command
  list [options]              List all configured marketplaces
  remove|rm [options] <name>  Remove a configured marketplace
  update [options] [name]     Update marketplace(s) from their source - updates
                              all if no name specified
````

<a id="cmd-33"></a>

### `claude plugin prune`
采集：`claude plugin prune --help`；退出码：`0`。

````text
Usage: claude plugin prune|autoremove [options]

Remove auto-installed dependencies that are no longer needed

Options:
  --dry-run            List what would be removed without removing
  -h, --help           Display help for command
  -s, --scope <scope>  Prune at scope: user, project, or local (default: "user")
  -y, --yes            Skip the confirmation prompt (required when stdin or
                       stdout is not a TTY)
````

<a id="cmd-34"></a>

### `claude plugin tag`
采集：`claude plugin tag --help`；退出码：`0`。

````text
Usage: claude plugin tag [options] [path]

Create a {name}--v{version} git tag for a plugin release, validating that
plugin.json and any enclosing marketplace entry agree

Options:
  --dry-run            Print what would be tagged without creating it
  -f, --force          Skip the dirty-working-tree and tag-already-exists checks
  -h, --help           Display help for command
  -m, --message <msg>  Tag annotation message (use %s for the version)
  --push               Push the tag to --remote after creating it
  --remote <name>      Remote to push to with --push (default: "origin")
````

<a id="cmd-35"></a>

### `claude plugin uninstall`
采集：`claude plugin uninstall --help`；退出码：`0`。

````text
Usage: claude plugin uninstall|remove [options] <plugin>

Uninstall an installed plugin

Options:
  -h, --help           Display help for command
  --keep-data          Preserve the plugin's persistent data directory
                       (~/.claude/plugins/data/{id}/)
  --prune              Also remove auto-installed dependencies that are no
                       longer needed (requires -y in non-interactive contexts)
  -s, --scope <scope>  Uninstall from scope: user, project, or local (default:
                       "user")
  -y, --yes            Skip the --prune confirmation prompt (required when stdin
                       or stdout is not a TTY)
````

<a id="cmd-36"></a>

### `claude plugin update`
采集：`claude plugin update --help`；退出码：`0`。

````text
Usage: claude plugin update [options] <plugin>

Update a plugin to the latest version (restart required to apply)

Options:
  -h, --help           Display help for command
  -s, --scope <scope>  Installation scope: user, project, local, managed
                       (default: user)
````

<a id="cmd-37"></a>

### `claude plugin validate`
采集：`claude plugin validate --help`；退出码：`0`。

````text
Usage: claude plugin validate [options] <path>

Validate a plugin or marketplace manifest

Options:
  -h, --help  Display help for command
  --strict    Treat warnings as errors (exit 1). Use in CI to fail on
              unrecognized fields, missing metadata, and other issues that the
              runtime tolerates.
````

<a id="cmd-38"></a>

### `claude project purge`
采集：`claude project purge --help`；退出码：`0`。

````text
Usage: claude project purge [options] [path]

Delete all Claude Code state for a project (transcripts, tasks, file history,
config entry)

Options:
  --all              Purge state for every project (mutually exclusive with
                     [path])
  --dry-run          List what would be deleted without deleting anything
  -h, --help         Display help for command
  -i, --interactive  Prompt for each item before deleting
  -y, --yes          Skip confirmation prompt
````

<a id="cmd-39"></a>

### `claude plugin marketplace add`
采集：`claude plugin marketplace add --help`；退出码：`0`。

````text
Usage: claude plugin marketplace add [options] <source>

Add a marketplace from a URL, path, or GitHub repo

Options:
  -h, --help           Display help for command
  --scope <scope>      Where to declare the marketplace: user (default),
                       project, or local
  --sparse <paths...>  Limit checkout to specific directories via git
                       sparse-checkout (for monorepos). Example: --sparse
                       .claude-plugin plugins
````

<a id="cmd-40"></a>

### `claude plugin marketplace list`
采集：`claude plugin marketplace list --help`；退出码：`0`。

````text
Usage: claude plugin marketplace list [options]

List all configured marketplaces

Options:
  -h, --help  Display help for command
  --json      Output as JSON
````

<a id="cmd-41"></a>

### `claude plugin marketplace remove`
采集：`claude plugin marketplace remove --help`；退出码：`0`。

````text
Usage: claude plugin marketplace remove|rm [options] <name>

Remove a configured marketplace

Options:
  -h, --help       Display help for command
  --scope <scope>  Remove the marketplace declaration from a specific settings
                   scope: user, project, or local. Omit to remove it from every
                   scope.
````

<a id="cmd-42"></a>

### `claude plugin marketplace update`
采集：`claude plugin marketplace update --help`；退出码：`0`。

````text
Usage: claude plugin marketplace update [options] [name]

Update marketplace(s) from their source - updates all if no name specified

Options:
  -h, --help  Display help for command
````

<a id="cmd-43"></a>

### `claude remote-control`
采集：`claude remote-control --help`；退出码：`1`。

````text
Error: You must be logged in to use Remote Control.

Remote Control is only available with claude.ai subscriptions. Please use `/login` to sign in with your claude.ai account.
````

<a id="cmd-44"></a>

### `claude import-conversations`
采集：`claude import-conversations --help`；退出码：`0`。

````text
Usage: claude import-conversations [options] <exportPath>

Options:
  --cwd <dir>  Archive directory the imported sessions anchor to
  --dry-run    Parse and verify manifest without writing files
  -h, --help   Display help for command
````

## 隐藏参数：本机二进制注册证据

`claude --help` 不是全部注册选项。以下从 **2.1.177 的本机原生二进制内嵌 JavaScript 选项注册代码**静态读取，未执行这些选项。来源是 `~/.local/share/claude/versions/2.1.177`；这是选项注册证据，功能开关、账号权限和业务效果仍未实跑。表中英文说明来自该安装包；没有用在线新版本参数替换本机参数。

这张表补充根帮助未显示的选项。内部 SDK、deep-link 和 teammate 参数同样列出以免遗漏，但它们不等于稳定公共接口。`--task-budget` 限制 API 侧任务 token 预算；`--max-budget-usd` 限制花费；`--max-turns` 限制 agentic turns，三者含义不同。

| 注册语法 | 安装包内说明 |
| --- | --- |
| `-d2e, --debug-to-stderr` | (deprecated) Enable debug mode (to stderr) |
| `--init` | Run Setup hooks with init trigger, then continue |
| `--init-only` | Run Setup and SessionStart:startup hooks, then exit |
| `--maintenance` | Run Setup hooks with maintenance trigger, then continue |
| `--session-mirror` | Emit transcript_mirror frames on stdout (SDK-internal; set by ProcessTransport when sessionStore is configured) |
| `--thinking <mode>` | Thinking mode: enabled (equivalent to adaptive), disabled；注册枚举：`enabled`、`adaptive`、`disabled` |
| `--thinking-display <display>` | How thinking content appears in the response；注册枚举：`summarized`、`omitted` |
| `--max-thinking-tokens <tokens>` | [DEPRECATED. Use --thinking instead for newer models] Maximum number of thinking tokens (only works with --print) |
| `--max-turns <turns>` | Maximum number of agentic turns in non-interactive mode. This will early exit the conversation after the specified number of turns. (only works with --print) |
| `--task-budget <tokens>` | API-side task budget in tokens (output_config.task_budget)；解析器要求正整数 |
| `--enable-auth-status` | Enable auth status messages in SDK mode |
| `--permission-prompt-tool <tool>` | MCP tool to use for permission prompts (only works with --print) |
| `--system-prompt-file <file>` | Read system prompt from a file |
| `--append-system-prompt-file <file>` | Read system prompt from a file and append to the default system prompt |
| `--plan-mode-instructions <instructions>` | Custom workflow body for plan mode. Replaces the default code-implementation phases in the plan-mode system reminder; the read-only enforcement preamble and ExitPlanMode protocol footer are always kept. |
| `--prefill <text>` | Pre-fill the prompt input with text without submitting it |
| `--deep-link-origin` | Signal that this session was launched from a deep link |
| `--deep-link-repo <slug>` | Repo slug the deep link ?repo= parameter resolved to the current cwd |
| `--deep-link-last-fetch <ms>` | FETCH_HEAD mtime in epoch ms, precomputed by the deep link trampoline |
| `--prefill-b64 <b64>` | Base64url-encoded --prefill value (deep-link shell-safe launch paths) |
| `--deep-link-cwd-b64 <b64>` | Base64url-encoded working directory (deep-link shell-safe launch paths) |
| `--resume-session-at <message id>` | When resuming, only messages up to and including the assistant message with <message.id> (use with --resume in print mode) |
| `--reply-on-resume` | When resuming, immediately query if the loaded transcript ends in a user-role message (set by /background mid-turn so the fork continues the in-flight turn). |
| `--rewind-files <user-message-id>` | Restore files to state at the specified user message and exit (requires --resume) |
| `--workload <tag>` | Workload tag for billing-header attribution (cc_workload). Process-scoped; set by SDK daemon callers that spawn subprocesses for cron work. (only works with --print) |
| `--managed-settings <json>` | Policy-tier settings JSON from a spawning parent process (SDK use only) |
| `--plugin-dir-no-mcp <path>` | Like --plugin-dir but the engine will not read this plugin's .mcp.json (caller owns its MCP connections) |
| `--advisor <model>` | Enable the server-side advisor tool with the specified model (alias or full ID). |
| `--enable-auto-mode` | (deprecated) Opt in to auto mode |
| `--channels <servers...>` | MCP servers whose channel notifications (inbound push) should register this session. Space-separated server names. |
| `--dangerously-load-development-channels <servers...>` | Load channel servers not on the approved allowlist. For local channel development only. Shows a confirmation dialog at startup. |
| `--agent-id <id>` | Teammate agent ID |
| `--agent-name <name>` | Teammate display name |
| `--team-name <name>` | Team name for teammate coordination |
| `--agent-color <color>` | Teammate UI color |
| `--plan-mode-required` | Require plan mode before implementation |
| `--parent-session-id <id>` | Parent session ID for analytics correlation |
| `--teammate-mode <mode>` | How to spawn teammates: "tmux", "in-process", or "auto" |
| `--agent-type <type>` | Custom agent type for this teammate |
| `--sdk-url <url>` | Use remote WebSocket endpoint for SDK I/O streaming (only with -p and stream-json format) |
| `--teleport [session]` | Resume a teleport session, optionally specify session ID |
| `--cloud [description\|session_id\|url]` | Create a cloud session with the given description, or attach to an existing one by session ID or claude.ai/code URL |
| `--rc [name]` | Alias for --remote-control |
| `--remote [description\|session_id\|url]` | Deprecated alias for --cloud |

隐藏子命令相关补充：`claude agents` 另注册 `--plugin-dir-no-mcp <path>`，含义为加载插件但由调用者管理它的 MCP 连接。plugin 操作共用隐藏的 `--cowork` 选项，用于 cowork 插件目录。二进制还包含 XAA MCP 注册代码，但本机 `claude mcp xaa --help` 只返回父级 MCP 帮助，不能据此列为已可用的子命令。Remote Control 的帮助被登录前置检查阻断，原始错误已保留在上文，不把根级 `--remote-control` 的说明冒充该子命令的完整帮助。


### 先于主解析器分派的内部入口

同一二进制的启动分派代码还识别以下入口。这些不在根 `Commands` 中，不属于上面的已验证帮助节点。部分处理器把首个参数直接当作 session ID，不能假设 `--help` 一定安全进入帮助分支，因此本次只静态读取，不调用这些内部操作。

| 入口/参数 | 静态可见语法或作用 | 验证边界 |
| --- | --- | --- |
| `logs <id>`、`attach <id>` | 查看后台日志、附着会话 | 账号功能 gate；未运行 |
| `stop <id>` / `kill <id>`、`respawn <id>`、`rm <id>` | 停止、重启、移除后台会话 | 传入首个位置参数，未运行 |
| `remote-control` / `rc` / `remote` / `sync` / `bridge` | 都分派到同一 bridge 入口 | 仅 remote-control 帮助尝试，遭登录检查阻断 |
| `daemon [subcommand] [options]` | 子命令字面量见下方 | 内部监督进程管理，未运行 |
| `--bg` / `--background` | 后台任务启动路由 | 未运行，不属于 swarm 支持字段 |
| `--routine` / `--routine=...` | 后台 routine 路由相关参数 | 内部参数，未核对业务解析与取值 |
| `--bg-pty-host`、`--bg-spare`、`--daemon-worker` | 内部进程入口 | 不作为公共接口；未运行 |

`daemon` 静态子命令集合：`run`、`install`、`uninstall`、`start`、`stop`、`restart`、`status`、`logs`（`log`）、`list`、`scheduled`、`assistant`、`remote-control`、`hub`。内嵌帮助字符串列出 `--json-path <p>`、`--log-file <p>`、`--help` / `-h`，`stop` 分支还有 `--any`、`--keep-workers`；启动解析器另含 `--origin`、`--spawned-by`。服务安装与管理子集受版本和 gate 控制；没有将静态存在等同为本机可用，也未穷举 `scheduled` 等内部处理器的私有协议参数。

## 会话命令与 goal

Shell 子命令（如 `claude plugin install`）、启动参数（如 `--model`）和会话内 `/goal` 属于不同接口。`/goal` 在本机注册了非交互入口，关键字段为 `name: "goal"`、`supportsNonInteractive: true`，交互入口的参数提示是 `[<condition> | clear]`。本次仅静态核验注册，没有发出 goal 或模型请求。

官方说明 `/goal <condition>` 设置完成条件，`/goal` 查看状态，`/goal clear` 清除；`clear` 的同义参数包括 `stop`、`off`、`reset`、`none`、`cancel`。可通过 `claude -p "/goal ..."` 使用非交互形式。在线文档明确标注恢复 picker 的修复从 `2.1.239` 开始，错误自动重试的新行为从 `2.1.269` 开始；本机 `2.1.177` 不据此获得这些保证。[官方 Goal 文档](https://code.claude.com/docs/en/goal)

以下是从该安装包中 `type: local-jsx/local/prompt` 且名称为字面量的命令注册提取的名称索引；它是静态发现集，**并非本机实际 `/` 菜单的承诺清单**。运行时功能开关会隐藏部分入口，插件与项目技能还会动态增加命令。没有启动交互会话去执行或枚举用户技能。

```text
/add-dir /advisor /agents /autocompact /autofix-pr /background /branch
/bridge-kick /brief /btw /cd /clear /color /compact
/config /context /copy /daemon /desktop /diff /effort
/exit /export /extra-usage /fast /feedback /focus /fork
/goal /heapdump /help /hooks /ide /init /init-verifiers
/insights /install /install-github-app /install-slack-app /login /logout /loops
/mcp /memory /mobile /model /passes /permissions /plan
/plugin /powerup /privacy-settings /pro-trial-expired /radio /rate-limit-options /recap
/reload-plugins /reload-skills /remote-control /remote-env /rename /resume /review
/scroll-speed /session /setup-bedrock /setup-vertex /skills /status /stickers
/stop /tasks /team-onboarding /teleport /terminal-setup /theme /toggle-memory
/tui /ultraplan /ultrareview /update /upgrade /usage /usage-credits
/version /voice /web-setup /wellbeing /workflows
```

其他 `/` 命令的参数与账号/环境条件参见[官方会话命令参考](https://code.claude.com/docs/en/commands)。会话内 `/help` 或输入 `/` 才能显示当前环境的实际可用集合；这不改变上文版本化 CLI 帮助覆盖范围。

## 在线资料与本机版本差异

核对日期：2026-09-15。在线资料持续更新，不是 `2.1.177` 的固定快照。

- [官方 CLI reference](https://code.claude.com/docs/en/cli-reference)：补证隐藏 `--max-turns`、system-prompt-file 系列等；本机静态注册表是版本依据。该页的 `--permission-prompts` 标注需要 `2.1.259`，`manual` 权限别名需要 `2.1.200`，本机帮助没有这些选项/枚举，未归入本机支持集。
- [官方 Goal 文档](https://code.claude.com/docs/en/goal)：补证非交互调用，区分较新版恢复、重试行为。
- [官方会话命令](https://code.claude.com/docs/en/commands)：用于查阅动态 `/` 命令；不把它们当成 CLI flags。
- [当前适配器](../../src/build-command.ts)：结构化 model/effort/turns/Goal/预算/持久化及受约束 native_args 的现行映射见 [README.md](README.md)。原始帮助仍按本页采集版本保存。

## 复核方式与限制

用同一版本重新运行本文件索引对应的 `<command> --help`，逐节点比较 `Usage`、`Commands`、`Arguments`、`Options`。原生二进制升级后，需要重新核验隐藏注册项；不能直接复用旧二进制偏移。此前 `remote-control --help` 返回登录要求，未继续登录或启动服务。实际模型、预算耗尽、恢复和 goal 连续执行均未在本次文档采集中测试。
