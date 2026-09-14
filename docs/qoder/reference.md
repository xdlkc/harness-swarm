# qoder 命令与参数参考

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。


采集日期：2026-09-15（Asia/Shanghai）。这是本机安装版本的静态快照，不代表上游最新版本。

| 项目 | 实测值 |
| --- | --- |
| harness 名称 | `qoder` |
| 可执行命令 | `qodercli` |
| PATH 解析路径 | `/Users/lkc/.local/bin/qodercli` |
| 实际文件 | `/Users/lkc/.qoder/bin/qodercli/qodercli-0.1.20` |
| 版本命令 | `qodercli -v` |
| 版本输出 | `0.1.20` |
| SHA-256 | `acf302993c4cfebdf252561bf106d620701c90fbf3e2d2ccf4758a446f491398` |

## 覆盖范围与采集方式

逐层读取根命令和每个可发现子命令的 `--help`，保留完整标准输出及非空标准错误；所有以下成功快照的退出码均为 `0`。只执行版本和帮助查询，未执行模型任务、登录、安装、升级、删除、配置写入或服务启动。帮助文本本身描述的操作不表示这些操作已被执行。

CLI 参数、交互式 slash 命令、模型工具和配置字段属于不同接口；下面分别记录。`--help` 中给出的类型、默认值、别名和重复参数语法均按本机原文保留。完整性限于此版本可通过帮助和下文说明的本地证据发现的接口；项目/插件动态注册的命令不可能由静态 CLI 帮助穷举。

## 命令索引

- [`qodercli`](#command-0)
- [`qodercli jobs`](#command-1)
- [`qodercli rm`](#command-2)
- [`qodercli completion`](#command-3)
- [`qodercli help`](#command-4)
- [`qodercli mcp`](#command-5)
- [`qodercli update`](#command-6)
- [`qodercli mcp add`](#command-7)
- [`qodercli mcp get`](#command-8)
- [`qodercli mcp list`](#command-9)
- [`qodercli mcp remove`](#command-10)

<a id="command-0"></a>

## `qodercli`

采集：`qodercli --help`。

```text
Qoder is a powerful terminal-based AI assistant that helps with software development tasks.
It provides an interactive chat interface with AI capabilities, code analysis, and MCP integration
to assist developers in writing, debugging, and understanding code directly from the terminal.

Usage:
  qodercli [flags]
  qodercli [command]

Examples:

  # Run in interactive mode
  qodercli

  # Run in a specific directory
  qodercli -w /path/to/project

  # Print version
  qodercli -v

  # Run a single non-interactive prompt
  qodercli -p "Explain the use of context in Go"

  # Run a single non-interactive prompt with JSON output format
  qodercli -p "Explain the use of context in Go" -f json

  # Run a single non-interactive prompt with limited agent iterations
  qodercli -p "Explain the use of context in Go" --max-turns 25

Job Management Commands:
  jobs         List concurrent job(s)
  rm           Remove concurrent job(s)

Additional Commands:
  completion   Generate the autocompletion script for the specified shell
  help         Help about any command
  mcp          Manage MCP (Model Context Protocol) servers
  update       Check remote version and self-update to the latest release

Flags:
      --agents string                  JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')
      --allowed-tools stringArray      Comma or space-separated list of allowed tool names (e.g. "Bash,Edit")
      --attachment stringArray         Attachment path (can be specified multiple times, e.g. --attachment=image1.png --attachment=image2.jpg)
      --branch string                  Branch name (only works with --worktree)
  -c, --continue                       Continue the most recent conversation
      --dangerously-skip-permissions   Bypass all permission checks
      --disallowed-tools stringArray   Comma or space-separated list of disallowed tool names (e.g. "Bash,Edit")
  -h, --help                           help for qodercli
      --input-format string            Input format for non-interactive mode (choices: "text", "stream-json") (default "text")
      --max-output-tokens string       Max tokens for model output response.(choices: "16k", "32k")
      --max-turns int                  Maximum agent loop cycles (0 for unlimited) - only effective in --print mode
      --model string                   Specify the model level to use for the session (choices: "auto", "efficient", "lite", "performance", "ultimate")
  -f, --output-format string           Output format for non-interactive mode (choices: "text", "json", "stream-json") (default "text")
      --path string                    Worktree path of the worktree job (only works with --worktree)
  -p, --print string                   Print response and exit (useful for pipes)
  -q, --quiet                          Hide spinner in non-interactive mode
  -r, --resume string                  Resume a conversation - provide a session Id to resume
  -v, --version                        Version
  -w, --workspace string               Current working directory
      --worktree                       Start a concurrent job via git worktree
      --yolo                           Bypass all permission checks（same as --dangerously-skip-permissions）

Use "qodercli [command] --help" for more information about a command.
```

<a id="command-1"></a>

## `qodercli jobs`

采集：`qodercli jobs --help`。

```text
List concurrent job(s) for current workspace.

Usage:
  qodercli jobs [flags]

Flags:
  -a, --all    Show all concurrent jobs (default true)
  -h, --help   help for jobs

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

<a id="command-2"></a>

## `qodercli rm`

采集：`qodercli rm --help`。

```text
Remove concurrent job(s) for current workspace.

Usage:
  qodercli rm [id] [flags]

Flags:
  -h, --help                help for rm
      --kubeconfig string   Kubeconfig of the kubernetes job
      --namespace string    Namespace of the kubernetes job

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

<a id="command-3"></a>

## `qodercli completion`

采集：`qodercli completion --help`。

```text
Qoder is a powerful terminal-based AI assistant that helps with software development tasks.
It provides an interactive chat interface with AI capabilities, code analysis, and MCP integration
to assist developers in writing, debugging, and understanding code directly from the terminal.

Usage:
  qodercli [flags]
  qodercli [command]

Examples:

  # Run in interactive mode
  qodercli

  # Run in a specific directory
  qodercli -w /path/to/project

  # Print version
  qodercli -v

  # Run a single non-interactive prompt
  qodercli -p "Explain the use of context in Go"

  # Run a single non-interactive prompt with JSON output format
  qodercli -p "Explain the use of context in Go" -f json

  # Run a single non-interactive prompt with limited agent iterations
  qodercli -p "Explain the use of context in Go" --max-turns 25

Job Management Commands:
  jobs         List concurrent job(s)
  rm           Remove concurrent job(s)

Additional Commands:
  completion   Generate the autocompletion script for the specified shell
  help         Help about any command
  mcp          Manage MCP (Model Context Protocol) servers
  update       Check remote version and self-update to the latest release

Flags:
      --agents string                  JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')
      --allowed-tools stringArray      Comma or space-separated list of allowed tool names (e.g. "Bash,Edit")
      --attachment stringArray         Attachment path (can be specified multiple times, e.g. --attachment=image1.png --attachment=image2.jpg)
      --branch string                  Branch name (only works with --worktree)
  -c, --continue                       Continue the most recent conversation
      --dangerously-skip-permissions   Bypass all permission checks
      --disallowed-tools stringArray   Comma or space-separated list of disallowed tool names (e.g. "Bash,Edit")
  -h, --help                           help for qodercli
      --input-format string            Input format for non-interactive mode (choices: "text", "stream-json") (default "text")
      --max-output-tokens string       Max tokens for model output response.(choices: "16k", "32k")
      --max-turns int                  Maximum agent loop cycles (0 for unlimited) - only effective in --print mode
      --model string                   Specify the model level to use for the session (choices: "auto", "efficient", "lite", "performance", "ultimate")
  -f, --output-format string           Output format for non-interactive mode (choices: "text", "json", "stream-json") (default "text")
      --path string                    Worktree path of the worktree job (only works with --worktree)
  -p, --print string                   Print response and exit (useful for pipes)
  -q, --quiet                          Hide spinner in non-interactive mode
  -r, --resume string                  Resume a conversation - provide a session Id to resume
  -v, --version                        Version
  -w, --workspace string               Current working directory
      --worktree                       Start a concurrent job via git worktree
      --yolo                           Bypass all permission checks（same as --dangerously-skip-permissions）

Use "qodercli [command] --help" for more information about a command.
```

<a id="command-4"></a>

## `qodercli help`

采集：`qodercli help --help`。

```text
Qoder is a powerful terminal-based AI assistant that helps with software development tasks.
It provides an interactive chat interface with AI capabilities, code analysis, and MCP integration
to assist developers in writing, debugging, and understanding code directly from the terminal.

Usage:
  qodercli [flags]
  qodercli [command]

Examples:

  # Run in interactive mode
  qodercli

  # Run in a specific directory
  qodercli -w /path/to/project

  # Print version
  qodercli -v

  # Run a single non-interactive prompt
  qodercli -p "Explain the use of context in Go"

  # Run a single non-interactive prompt with JSON output format
  qodercli -p "Explain the use of context in Go" -f json

  # Run a single non-interactive prompt with limited agent iterations
  qodercli -p "Explain the use of context in Go" --max-turns 25

Job Management Commands:
  jobs         List concurrent job(s)
  rm           Remove concurrent job(s)

Additional Commands:
  completion   Generate the autocompletion script for the specified shell
  help         Help about any command
  mcp          Manage MCP (Model Context Protocol) servers
  update       Check remote version and self-update to the latest release

Flags:
      --agents string                  JSON object defining custom agents (e.g. '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}')
      --allowed-tools stringArray      Comma or space-separated list of allowed tool names (e.g. "Bash,Edit")
      --attachment stringArray         Attachment path (can be specified multiple times, e.g. --attachment=image1.png --attachment=image2.jpg)
      --branch string                  Branch name (only works with --worktree)
  -c, --continue                       Continue the most recent conversation
      --dangerously-skip-permissions   Bypass all permission checks
      --disallowed-tools stringArray   Comma or space-separated list of disallowed tool names (e.g. "Bash,Edit")
  -h, --help                           help for qodercli
      --input-format string            Input format for non-interactive mode (choices: "text", "stream-json") (default "text")
      --max-output-tokens string       Max tokens for model output response.(choices: "16k", "32k")
      --max-turns int                  Maximum agent loop cycles (0 for unlimited) - only effective in --print mode
      --model string                   Specify the model level to use for the session (choices: "auto", "efficient", "lite", "performance", "ultimate")
  -f, --output-format string           Output format for non-interactive mode (choices: "text", "json", "stream-json") (default "text")
      --path string                    Worktree path of the worktree job (only works with --worktree)
  -p, --print string                   Print response and exit (useful for pipes)
  -q, --quiet                          Hide spinner in non-interactive mode
  -r, --resume string                  Resume a conversation - provide a session Id to resume
  -v, --version                        Version
  -w, --workspace string               Current working directory
      --worktree                       Start a concurrent job via git worktree
      --yolo                           Bypass all permission checks（same as --dangerously-skip-permissions）

Use "qodercli [command] --help" for more information about a command.
```

<a id="command-5"></a>

## `qodercli mcp`

采集：`qodercli mcp --help`。

```text
Manage MCP (Model Context Protocol) servers for AI model interactions.

Usage:
  qodercli mcp [command]

Available Commands:
  add         Add a new MCP server
  get         Get details of an MCP server
  list        List all MCP servers
  remove      Remove an MCP Server

Flags:
  -h, --help   help for mcp

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory

Use "qodercli mcp [command] --help" for more information about a command.
```

<a id="command-6"></a>

## `qodercli update`

采集：`qodercli update --help`。

```text
Usage: qodercli update
This command doesn't accept any arguments or flags.
```

<a id="command-7"></a>

## `qodercli mcp add`

采集：`qodercli mcp add --help`。

```text
Add a new MCP server with the specified name and endpoint.

Usage:
  qodercli mcp add [name] [endpoint] [flags]

Flags:
  -e, --env stringArray      Set environment variables (e.g. -e KEY=value)
  -H, --header stringArray   Set HTTP headers for SSE and HTTP transports (e.g. -H "X-Api-Key: abc123" -H "X-Custom: value")
  -h, --help                 help for add
  -s, --scope string         Configuration scope (local, user, or project) (default: "local") (default "local")
  -t, --transport string     Transport type (stdio, sse, http) (default: "stdio") (default "stdio")

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

<a id="command-8"></a>

## `qodercli mcp get`

采集：`qodercli mcp get --help`。

```text
Get detailed information about a specific MCP server.

Usage:
  qodercli mcp get [name] [flags]

Flags:
  -h, --help   help for get

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

<a id="command-9"></a>

## `qodercli mcp list`

采集：`qodercli mcp list --help`。

```text
List all configured MCP servers and their status.

Usage:
  qodercli mcp list [flags]

Flags:
  -h, --help   help for list

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

<a id="command-10"></a>

## `qodercli mcp remove`

采集：`qodercli mcp remove --help`。

```text
Remove an MCP Server by its name.

Usage:
  qodercli mcp remove [name] [flags]

Flags:
  -h, --help           help for remove
  -s, --scope string   Configuration scope (local, user, or project) - if not specified, removes from whichever scope it exists in

Global Flags:
  -v, --version            Version
  -w, --workspace string   Current working directory
```

## 本机帮助的异常与未公开接口

根帮助列出了 `completion`，但 `qodercli completion --help` 和 `qodercli help --help` 都返回根帮助，无法由此得到补全脚本的独立参数。未把 Cobra 常见的 shell 名称假定为本机支持，额外只做了以下帮助探测：

### `qodercli completion bash --help`

退出码 `1`：

```text
Error: unknown command "bash" for "qodercli"
Run 'qodercli --help' for usage.
```

### `qodercli completion zsh --help`

退出码 `1`：

```text
Error: unknown command "zsh" for "qodercli"
Run 'qodercli --help' for usage.
```

### `qodercli completion fish --help`

退出码 `1`：

```text
Error: unknown command "fish" for "qodercli"
Run 'qodercli --help' for usage.
```

### `qodercli completion powershell --help`

退出码 `1`：

```text
Error: unknown command "powershell" for "qodercli"
Run 'qodercli --help' for usage.
```

`update --help` 的原文明确该命令不接受参数；本次没有执行 `update`。本机是编译后的 Go 可执行文件，没有取得与该构建匹配的完整参数注册源码，因此不声称穷尽隐藏参数或交互式 slash 命令。二进制字面量搜索不足以证明某项能力存在或不存在。

## 上游现行文档补充：不能当作 0.1.20 的本机接口

2026-09-15 查询到的[官方 CLI 参数文档](https://docs.qoder.com/cli/cli-reference)以 `qoder` 为命令名、以 `--cwd` 表示工作目录；本机实际为 `qodercli` 与 `--workspace`，两者已有明显代际差异。上游现行参数不能直接合并进本机快照。

[官方 Goal 参考](https://docs.qoder.com/cli/goal-reference)列出交互式 `/goal <description> [--turns <N>]`，以及 `status`、`clear`、`pause`、`resume`、`take`；这说明现行 Qoder 文档具有 Goal 能力，不能证明本机 0.1.20 或 `qodercli -p` 支持它。[官方 slash 索引](https://docs.qoder.com/cli/slash-reference)还列有 `/effort`、`/loop` 等交互控制。此处只提供版本差异线索，没有将其标为本机已验证功能。
