# OpenCode 2 — 命令、会话 API 与参数参考

格式说明：帮助快照保留完整参数文本，仅去除终端控制字符与行末空白。

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、会话历史映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；opencode2 的 `run` 与 resume/fork 尚未做真实模型任务冒烟。

采集日期：2026-09-20（Asia/Shanghai）。版本：`opencode2 v0.0.0-beta-19192`。可执行文件：`/Users/lkc/.opencode/bin/opencode2`（Mach-O 64-bit，Go 重写的 "OpenCode 2.0 preview"，不在 `PATH`）。

```text
$ opencode2 --version
opencode2 v0.0.0-beta-19192
```

## 架构与存储

opencode2 是 client-server 架构。会话由后台 service 持有，客户端命令通过 `--standalone`（私有 server）或 `--server <url>` 连接；`opencode2 api` 按需拉起 server 并直接返回 JSON。数据目录与 opencode v1 共享：

```text
$ opencode2 debug paths
home       /Users/lkc
data       /Users/lkc/.local/share/opencode
cache      /Users/lkc/.cache/opencode
config     /Users/lkc/.config/opencode
state      /Users/lkc/.local/state/opencode
tmp        /private/var/folders/…/opencode
bin        /Users/lkc/.cache/opencode/bin
log        /Users/lkc/.local/share/opencode/log
repos      /Users/lkc/.local/share/opencode/repos
```

## 命令索引

- [`opencode2`](#cli-0)
- [`opencode2 run`](#cli-1)
- [`opencode2 export`](#cli-2)
- [`opencode2 import`](#cli-3)
- [`opencode2 api`](#cli-4)
- [`opencode2 service`](#cli-5)
- [`opencode2 serve`](#cli-6)
- [`opencode2 stats`](#cli-7)
- [`opencode2 debug`](#cli-8)

## 完整 CLI 帮助快照

<a id="cli-0"></a>

### `opencode2 --help`

退出码：`0`。

```text
DESCRIPTION
  OpenCode 2.0 preview command line interface

USAGE
  opencode2 <subcommand> [flags] [<directory>]

ARGUMENTS
  directory string    Directory to start OpenCode in (optional)

FLAGS
  --standalone            Run with a private server instead of the background service
  --server string         Connect to a server URL instead of the background service
  --auto                  Auto-approve permissions that are not explicitly denied
  --continue, -c          Continue the last session
  --session, -s string    Session ID to continue
  --prompt string         Prompt to use

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)

SUBCOMMANDS
  upgrade, update    Upgrade OpenCode to the latest or a specific version
  acp                Start an Agent Client Protocol server
  api                Make a request to the running server
  debug              Debugging and troubleshooting tools
  console            Manage OpenCode Console access
  auth               manage AI providers and credentials
  mcp                Manage MCP (Model Context Protocol) servers
  plugin             Manage plugins
  models             List all available models
  stats              Show shareable usage statistics
  export             Export session data as JSON
  import             Import session data from a JSON file or URL
  mini               Start the minimal interactive interface
  run                Run OpenCode with a message
  service            Manage the background server
  pair               Show server pairing information
  serve              Start the v2 API and web server
```

<a id="cli-1"></a>

### `opencode2 run --help`

退出码：`0`。

```text
DESCRIPTION
  Run OpenCode with a message

USAGE
  opencode2 run [flags] [<message...>]

ARGUMENTS
  message... string    Message to send (optional)

FLAGS
  --standalone            Run with a private server instead of the background service
  --server string         Connect to a server URL instead of the background service
  --continue, -c          Continue the last session
  --session, -s string    Session ID to continue
  --fork                  Fork the session before continuing
  --model, -m string      Model to use in the format provider/model#variant
  --agent string          Agent to use
  --format choice         Output format (choices: default, json)
  --file, -f string       File to attach to the message
  --title string          Session title
  --thinking              Show thinking blocks
  --auto                  Auto-approve permissions that are not explicitly denied

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-2"></a>

### `opencode2 export --help`

退出码：`0`。

```text
DESCRIPTION
  Export session data as JSON

USAGE
  opencode2 export [flags] [<session>]

ARGUMENTS
  session string    Session ID to export (optional)

FLAGS
  --standalone       Run with a private server instead of the background service
  --server string    Connect to a server URL instead of the background service
  --sanitize         Redact sensitive transcript and file data

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-3"></a>

### `opencode2 import --help`

退出码：`0`。

```text
DESCRIPTION
  Import session data from a JSON file or URL

USAGE
  opencode2 import [flags] <file>

ARGUMENTS
  file string    JSON file or URL to import

FLAGS
  --standalone          Run with a private server instead of the background service
  --server string       Connect to a server URL instead of the background service
  --directory string    Directory in which to import the session

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-4"></a>

### `opencode2 api --help`

退出码：`0`。

```text
DESCRIPTION
  Make a request to the running server

USAGE
  opencode2 api [flags] <operation | method path...>

ARGUMENTS
  operation | method path... string OpenAPI operation ID, or an HTTP method followed by a path

FLAGS
  --standalone           Run with a private server instead of the background service
  --server string        Connect to a server URL instead of the background service
  --data, -d string      Request body
  --header, -H string    Request header in name:value form
  --param key=value      OpenAPI path or query parameter

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-5"></a>

### `opencode2 service --help`

退出码：`0`。

```text
DESCRIPTION
  Manage the background server

USAGE
  opencode2 service <subcommand> [flags]

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)

SUBCOMMANDS
  start      Start the background server
  restart    Restart the background server
  status     Show background server status
  stop       Stop the background server
  get        Get service configuration
  set        Set service configuration
  unset      Unset service configuration
```

<a id="cli-6"></a>

### `opencode2 serve --help`

退出码：`0`。

```text
DESCRIPTION
  Start the v2 API and web server

USAGE
  opencode2 serve [flags]

FLAGS
  --hostname string
  --port integer
  --cors string        Additional allowed CORS origin (repeat for multiple origins)
  --service
  --stdio

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-7"></a>

### `opencode2 stats --help`

退出码：`0`。

```text
DESCRIPTION
  Show shareable usage statistics

USAGE
  opencode2 stats [flags]

FLAGS
  --standalone        Run with a private server instead of the background service
  --server string     Connect to a server URL instead of the background service
  --days integer      Show the last N days; 0 means today
  --year integer      Show a calendar year
  --all               Show lifetime statistics
  --project string    Filter by project ID, or use "." for the current project
  --models            Show model usage
  --tools             Show tool reliability
  --cost              Show cost and token details
  --full              Show every detailed section
  --limit integer     Number of rows in detailed sections
  --json              Output statistics as JSON

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)
```

<a id="cli-8"></a>

### `opencode2 debug --help`

退出码：`0`。

```text
DESCRIPTION
  Debugging and troubleshooting tools

USAGE
  opencode2 debug <subcommand> [flags]

GLOBAL FLAGS
  --help, -h                                                          Show help information
  --version, -v                                                       Show version information
  --wizard                                                            Start wizard mode for a command
  --completions <bash|zsh|fish|sh>                                    Print shell completion script (choices: bash, zsh, fish, sh)
  --log-level <all|trace|debug|info|warn|warning|error|fatal|none>    Sets the minimum log level (choices: all, trace, debug, info, warn, warning, error, fatal, none)
  --print-logs                                                        Print logs to stderr (server logs require --standalone)

SUBCOMMANDS
  agents    List all agents
  config    List configuration sources
  paths     Show global paths (data, config, cache, state)
```

## 会话 API（v2 HttpApi）

来源：`opencode2 api GET /openapi.json`（"Experimental HttpApi surface for selected instance routes"，openapi 3.1.0）。这是 `hs sessions` 对 opencode2 的查询通道，operationId 命名约定为 `v2.<tag>.<method>`。

### 会话相关端点

| 方法 + 路径 | operationId | 说明 |
| --- | --- | --- |
| `GET /api/session` | `v2.session.list` | 列出会话（`data` 数组 + `cursor` 分页） |
| `GET /api/session/{sessionID}` | `v2.session.get` | 单个会话 |
| `POST /api/session/{sessionID}/fork` | `v2.session.fork` | fork 会话（body 需 `boundary`） |
| `DELETE /api/session/{sessionID}` | `v2.session.remove` | 删除会话 |
| `GET /api/session/{sessionID}/export` | `v2.session.export` | 导出会话 JSON |
| `GET /api/session/{sessionID}/message` | `v2.message.list` | 会话消息 |
| `GET /api/session/stats` | `v2.session.stats` | 会话统计 |
| `GET /api/session/active` | `v2.session.active` | 活跃会话 |
| `POST /api/session/{sessionID}/prompt` | `v2.session.prompt` | 发送消息（resume） |

### `v2.session.list` 查询参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `limit` | string | 最大返回数（默认最新 50） |
| `order` | `asc\|desc` | 排序 |
| `search` | string | 关键字搜索（服务端原生过滤） |
| `directory` | string | 按工作目录过滤 |
| `parentID` | string | 按父会话过滤；`null` 只返回根会话 |
| `project` / `subpath` / `workspace` | string | 按项目/子路径/工作区过滤 |
| `cursor` | string | 分页游标（`cursor.previous` / `cursor.next`） |

### `Session.Info` 结构

```jsonc
{
  "id": "ses_…",            // 必填，^ses
  "parentID": "ses_…",      // fork 血缘（可选）
  "fork": { "sessionID": "ses_…", "boundary": { "type": "before|through", "messageID": "msg_…" } },
  "projectID": "…",
  "agent": "build",
  "model": { "id": "…", "providerID": "…", "variant": "…" },
  "cost": 1.73,             // Money.USD
  "tokens": { "input": 0, "output": 0, "reasoning": 0, "cache": { "read": 0, "write": 0 } },
  "outcome": "succeeded|failed|interrupted",
  "time": { "created": 0, "updated": 0, "idle": 0, "viewed": 0, "archived": 0 },
  "title": "…",
  "location": { "directory": "…" },
  "subpath": "…",
  "metadata": {},
  "revert": {}
}
```

## 来源与更新方式

1. 本机 `opencode2 --version` 与各子命令 `--help`；快照只去除终端控制字符及末尾空白。
2. `opencode2 api GET /openapi.json`：会话 API、`Session.Info` 与查询参数。
3. `opencode2 debug paths`：全局路径。

升级后重新采集版本及索引中的每个帮助入口；会话 API 属 "Experimental HttpApi surface"，随 beta 版本可能变化，需重新核对 operationId 与 schema。当前适配差异见 [README.md](README.md)。
