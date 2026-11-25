# OpenCode CLI reference

格式说明：帮助快照保留完整参数文本，仅去除终端控制字符与行末空白。

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。


## 版本与覆盖范围

- 采集日期：2026-09-15（Asia/Shanghai）。
- binary：`/usr/local/bin/opencode`。
- 真实文件：`/usr/local/lib/node_modules/opencode-ai/bin/opencode.exe`（Mach-O x86_64）。
- `opencode --version`：`1.18.21`；安装包 `opencode-ai/package.json` 版本相同。
- binary SHA-256：`2e26ced939de9d96c15c7e9abc8451047bba75ae679a93d0ba9615a2f3825f5a`。
- 采集方法：递归执行各命令 `--help`，包括 debug / mcp 等深层子命令；从**该安装二进制内嵌的 JavaScript 注册代码**补查隐藏参数与隐藏 `console` 分支，再执行隐藏分支 `--help`。
- 本文保留 73 个帮助快照，其中包含别名入口；不把默认 positional 当成另一个子命令。没有执行真实任务、认证、安装、升级、数据库查询或用户配置 dump。
- `completion --help` 返回根帮助且退出 1，按原样保留；其余快照退出 0。CLI 帮助列出的类型、默认值、choices、必填性与别名均保留。

## 命令索引

- `opencode [project]`（默认 TUI）
- `opencode acp`
- `opencode agent`
- `opencode agent create`
- `opencode agent list`
- `opencode attach`
- `opencode auth`
- `opencode auth list`
- `opencode auth login`
- `opencode auth logout`
- `opencode completion`
- `opencode console`
- `opencode console login`
- `opencode console logout`
- `opencode console open`
- `opencode console orgs`
- `opencode console switch`
- `opencode db`
- `opencode db path`
- `opencode debug`
- `opencode debug agent`
- `opencode debug config`
- `opencode debug file`
- `opencode debug file list`
- `opencode debug file read`
- `opencode debug file search`
- `opencode debug info`
- `opencode debug lsp`
- `opencode debug lsp diagnostics`
- `opencode debug lsp document-symbols`
- `opencode debug lsp symbols`
- `opencode debug paths`
- `opencode debug rg`
- `opencode debug rg files`
- `opencode debug rg search`
- `opencode debug scrap`
- `opencode debug skill`
- `opencode debug snapshot`
- `opencode debug snapshot diff`
- `opencode debug snapshot patch`
- `opencode debug snapshot track`
- `opencode debug startup`
- `opencode debug v2`
- `opencode debug wait`
- `opencode export`
- `opencode github`
- `opencode github install`
- `opencode github run`
- `opencode import`
- `opencode mcp`
- `opencode mcp add`
- `opencode mcp auth`
- `opencode mcp auth list`
- `opencode mcp debug`
- `opencode mcp list`
- `opencode mcp logout`
- `opencode models`
- `opencode plug`
- `opencode plugin`
- `opencode pr`
- `opencode providers`
- `opencode providers list`
- `opencode providers login`
- `opencode providers logout`
- `opencode run`
- `opencode serve`
- `opencode session`
- `opencode session delete`
- `opencode session list`
- `opencode stats`
- `opencode uninstall`
- `opencode upgrade`
- `opencode web`

`providers` 别名为 `auth`，`plugin` 别名为 `plug`；`providers list` / `auth list`、`mcp list`、`mcp auth list` 的 `list` 均有 `ls` 别名。别名继承对应命令参数。`db [query]` 是 db 的默认命令，帮助已包含 query 及 format 参数。`console` 为隐藏分支，不出现在根帮助中。

## 隐藏参数补证

这些参数来自当前 **1.18.21 二进制内嵌代码**中的 `.option(..., { hidden: true })`（压缩后 `hidden:!0`），不是从其他版本源码推断。普通 `--help` 不显示它们；`run --help --show-hidden` 实测也未揭示它们。

| 所属入口 | 隐藏参数 | 声明与限制 |
|---|---|---|
| 默认 TUI | `--yolo`、`--dangerously-skip-permissions` | boolean，默认 false；与 `--auto` 一起用于计算自动批准状态 |
| 默认 TUI | `--replay` | boolean；公开的 `--no-replay` 用于关闭 replay |
| 默认 TUI | `--demo` | boolean；内部 demo 入口，无稳定公开说明 |
| `attach` | `--replay` | boolean；公开 help 显示关闭形式 `--no-replay` |
| `run` | `--mini` | boolean，默认 false；注册存在，但 handler 限制 mini 必须不使用 `run` 子命令，不能把它当作可用的 `run --mini` 示例 |
| `run` | `--replay` | boolean，默认 true；用于交互历史重放，`--no-replay` 关闭 |
| `run` | `--replay-limit` | number；限制交互重放消息数 |
| `run` | `--yolo`、`--dangerously-skip-permissions` | boolean，默认 false；`auto = args.auto || args.yolo || args["dangerously-skip-permissions"]` |
| `run` | `--demo` | boolean，默认 false；要求 mini 模式 |

源码进一步限制 mini 不与 `--command` 或 `--format json` 合用。隐藏参数的注册事实已静态核验；没有执行它们来触发任务。默认 TUI 与 attach 的公开 mini/replay 选项仍以各自帮助为准。

隐藏 `console` 注册了 `login [url]`、`logout [email]`、`switch`、`orgs`、`open`，六个入口的帮助都在下面。内部 account 的短命令定义没有直接注册为根命令；不要把 `opencode login` 当成已验证入口。

## Goal、slash 与完整性边界

当前捕获的公开/隐藏 CLI 命令树没有独立 goal 子命令，run 注册中没有 goal、max-turns 或预算字段。CLI `run --command` 可运行配置定义的命令，这不等于内置 `/goal`。交互 UI、插件、自定义 commands、环境变量和配置 schema 是独立接口，不属于本页的 CLI 子命令/参数枚举；未用真实会话验证 slash 能力，不能把“帮助未列出”推导成所有插件都不可能提供 goal。

安装二进制的命令注册补查覆盖静态 `.option` hidden 参数与隐藏 console；动态插件未来新增的接口无法预先枚举。本机另有 `best-harness/repos/opencode` 源码仓库，版本为 1.18.18，与本 binary 不一致，未将其内容作为本版本事实。

## 完整帮助快照

### `opencode --help`

退出码：`0`。

```text
⠀                                ▄
█▀▀█ █▀▀█ █▀▀█ █▀▀▄ █▀▀▀ █▀▀█ █▀▀█ █▀▀█
█  █ █  █ █▀▀▀ █  █ █    █  █ █  █ █▀▀▀
▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀

Commands:
  opencode completion          generate shell completion script
  opencode acp                 start ACP (Agent Client Protocol) server
  opencode mcp                 manage MCP (Model Context Protocol) servers
  opencode [project]           start opencode tui                                          [default]
  opencode attach <url>        attach to a running opencode server
  opencode run [message..]     run opencode with a message
  opencode debug               debugging and troubleshooting tools
  opencode providers           manage AI providers and credentials                   [aliases: auth]
  opencode agent               manage agents
  opencode upgrade [target]    upgrade opencode to the latest or a specific version
  opencode uninstall           uninstall opencode and remove all related files
  opencode serve               starts a headless opencode server
  opencode web                 start opencode server and open web interface
  opencode models [provider]   list all available models
  opencode stats               show token usage and cost statistics
  opencode export [sessionID]  export session data as JSON
  opencode import <file>       import session data from JSON file or URL
  opencode github              manage GitHub agent
  opencode pr <number>         fetch and checkout a GitHub PR branch, then run opencode
  opencode session             manage sessions
  opencode plugin <module>     install plugin and update config                      [aliases: plug]
  opencode db                  database tools

Positionals:
  project  path to start opencode in                                                        [string]

Options:
  -h, --help          show help                                                            [boolean]
  -v, --version       show version number                                                  [boolean]
      --print-logs    print logs to stderr                                                 [boolean]
      --log-level     log level                 [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure          run without external plugins                                         [boolean]
      --port          port to listen on                                        [number] [default: 0]
      --hostname      hostname to listen on                          [string] [default: "127.0.0.1"]
      --mdns          enable mDNS service discovery (defaults hostname to 0.0.0.0)
                                                                          [boolean] [default: false]
      --mdns-domain   custom domain name for mDNS service (default: opencode.local)
                                                                [string] [default: "opencode.local"]
      --cors          additional domains to allow for CORS                     [array] [default: []]
  -m, --model         model to use in the format of provider/model                          [string]
  -c, --continue      continue the last session                                            [boolean]
  -s, --session       session id to continue                                                [string]
      --fork          fork the session when continuing (use with --continue or --session)  [boolean]
      --prompt        prompt to use                                                         [string]
      --agent         agent to use                                                          [string]
      --auto          auto-approve permissions that are not explicitly denied (dangerous!)
                                                                          [boolean] [default: false]
      --mini          start the minimal interactive interface             [boolean] [default: false]
      --no-replay     disable mini session history replay on resume and after resize       [boolean]
      --replay-limit  cap visible mini replay to the newest N messages                      [number]
```

### `opencode completion --help`

退出码：`1`。

```text
⠀                                ▄
█▀▀█ █▀▀█ █▀▀█ █▀▀▄ █▀▀▀ █▀▀█ █▀▀█ █▀▀█
█  █ █  █ █▀▀▀ █  █ █    █  █ █  █ █▀▀▀
▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀

Commands:
  opencode completion          generate shell completion script
  opencode acp                 start ACP (Agent Client Protocol) server
  opencode mcp                 manage MCP (Model Context Protocol) servers
  opencode [project]           start opencode tui                                          [default]
  opencode attach <url>        attach to a running opencode server
  opencode run [message..]     run opencode with a message
  opencode debug               debugging and troubleshooting tools
  opencode providers           manage AI providers and credentials                   [aliases: auth]
  opencode agent               manage agents
  opencode upgrade [target]    upgrade opencode to the latest or a specific version
  opencode uninstall           uninstall opencode and remove all related files
  opencode serve               starts a headless opencode server
  opencode web                 start opencode server and open web interface
  opencode models [provider]   list all available models
  opencode stats               show token usage and cost statistics
  opencode export [sessionID]  export session data as JSON
  opencode import <file>       import session data from JSON file or URL
  opencode github              manage GitHub agent
  opencode pr <number>         fetch and checkout a GitHub PR branch, then run opencode
  opencode session             manage sessions
  opencode plugin <module>     install plugin and update config                      [aliases: plug]
  opencode db                  database tools

Positionals:
  project  path to start opencode in                                                        [string]

Options:
  -h, --help          show help                                                            [boolean]
  -v, --version       show version number                                                  [boolean]
      --print-logs    print logs to stderr                                                 [boolean]
      --log-level     log level                 [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure          run without external plugins                                         [boolean]
      --port          port to listen on                                        [number] [default: 0]
      --hostname      hostname to listen on                          [string] [default: "127.0.0.1"]
      --mdns          enable mDNS service discovery (defaults hostname to 0.0.0.0)
                                                                          [boolean] [default: false]
      --mdns-domain   custom domain name for mDNS service (default: opencode.local)
                                                                [string] [default: "opencode.local"]
      --cors          additional domains to allow for CORS                     [array] [default: []]
  -m, --model         model to use in the format of provider/model                          [string]
  -c, --continue      continue the last session                                            [boolean]
  -s, --session       session id to continue                                                [string]
      --fork          fork the session when continuing (use with --continue or --session)  [boolean]
      --prompt        prompt to use                                                         [string]
      --agent         agent to use                                                          [string]
      --auto          auto-approve permissions that are not explicitly denied (dangerous!)
                                                                          [boolean] [default: false]
      --mini          start the minimal interactive interface             [boolean] [default: false]
      --no-replay     disable mini session history replay on resume and after resize       [boolean]
      --replay-limit  cap visible mini replay to the newest N messages                      [number]
```

### `opencode acp --help`

退出码：`0`。

```text
opencode acp

start ACP (Agent Client Protocol) server

Options:
  -h, --help         show help                                                             [boolean]
  -v, --version      show version number                                                   [boolean]
      --print-logs   print logs to stderr                                                  [boolean]
      --log-level    log level                  [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure         run without external plugins                                          [boolean]
      --port         port to listen on                                         [number] [default: 0]
      --hostname     hostname to listen on                           [string] [default: "127.0.0.1"]
      --mdns         enable mDNS service discovery (defaults hostname to 0.0.0.0)
                                                                          [boolean] [default: false]
      --mdns-domain  custom domain name for mDNS service (default: opencode.local)
                                                                [string] [default: "opencode.local"]
      --cors         additional domains to allow for CORS                      [array] [default: []]
      --cwd          working directory           [string] [default: "~/Code/harness-swarm"]
```

### `opencode mcp --help`

退出码：`0`。

```text
opencode mcp

manage MCP (Model Context Protocol) servers

Commands:
  opencode mcp add [name]     add an MCP server
  opencode mcp list           list MCP servers and their status                        [aliases: ls]
  opencode mcp auth [name]    authenticate with an OAuth-enabled MCP server
  opencode mcp logout [name]  remove OAuth credentials for an MCP server
  opencode mcp debug <name>   debug OAuth connection for an MCP server

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode attach --help`

退出码：`0`。

```text
opencode attach <url>

attach to a running opencode server

Positionals:
  url  http://localhost:4096                                                     [string] [required]

Options:
  -h, --help          show help                                                            [boolean]
  -v, --version       show version number                                                  [boolean]
      --print-logs    print logs to stderr                                                 [boolean]
      --log-level     log level                 [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure          run without external plugins                                         [boolean]
      --dir           directory to run in                                                   [string]
  -c, --continue      continue the last session                                            [boolean]
  -s, --session       session id to continue                                                [string]
      --fork          fork the session when continuing (use with --continue or --session)  [boolean]
  -p, --password      basic auth password (defaults to OPENCODE_SERVER_PASSWORD)            [string]
  -u, --username      basic auth username (defaults to OPENCODE_SERVER_USERNAME or 'opencode')
                                                                                            [string]
      --mini          start the minimal interactive interface             [boolean] [default: false]
      --no-replay     disable mini session history replay on resume and after resize       [boolean]
      --replay-limit  cap visible mini replay to the newest N messages                      [number]
```

### `opencode run --help`

退出码：`0`。

```text
opencode run [message..]

run opencode with a message

Positionals:
  message  message to send                                                     [array] [default: []]

Options:
  -h, --help         show help                                                             [boolean]
  -v, --version      show version number                                                   [boolean]
      --print-logs   print logs to stderr                                                  [boolean]
      --log-level    log level                  [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure         run without external plugins                                          [boolean]
      --command      the command to run, use message for args                               [string]
  -c, --continue     continue the last session                                             [boolean]
  -s, --session      session id to continue                                                 [string]
      --fork         fork the session before continuing (requires --continue or --session) [boolean]
      --share        share the session                                                     [boolean]
  -m, --model        model to use in the format of provider/model                           [string]
      --agent        agent to use                                                           [string]
      --format       format: default (formatted) or json (raw JSON events)
                                          [string] [choices: "default", "json"] [default: "default"]
  -f, --file         file(s) to attach to message                                            [array]
      --title        title for the session (uses truncated prompt if no value provided)     [string]
      --attach       attach to a running opencode server (e.g., http://localhost:4096)      [string]
  -p, --password     basic auth password (defaults to OPENCODE_SERVER_PASSWORD)             [string]
  -u, --username     basic auth username (defaults to OPENCODE_SERVER_USERNAME or 'opencode')
                                                                                            [string]
      --dir          directory to run in, path on remote server if attaching                [string]
      --port         port for the local server (defaults to random port if no value provided)
                                                                                            [number]
      --variant      model variant (provider-specific reasoning effort, e.g., high, max, minimal)
                                                                                            [string]
      --thinking     show thinking blocks                                                  [boolean]
  -i, --interactive  run in direct interactive split-footer mode          [boolean] [default: false]
      --auto         auto-approve permissions that are not explicitly denied (dangerous!)
                                                                          [boolean] [default: false]
```

### `opencode debug --help`

退出码：`0`。

```text
opencode debug

debugging and troubleshooting tools

Commands:
  opencode debug config        show resolved configuration
  opencode debug lsp           LSP debugging utilities
  opencode debug rg            ripgrep debugging utilities
  opencode debug file          file system debugging utilities
  opencode debug scrap         list all known projects
  opencode debug skill         list all available skills
  opencode debug snapshot      snapshot debugging utilities
  opencode debug startup       print startup timing
  opencode debug agent <name>  show agent configuration details
  opencode debug v2            debug v2 catalog and built-in plugins
  opencode debug info          show debug information
  opencode debug paths         show global paths (data, config, cache, state)
  opencode debug wait          wait indefinitely (for debugging)

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode providers --help`

退出码：`0`。

```text
opencode providers

manage AI providers and credentials

Commands:
  opencode providers list               list providers and credentials                 [aliases: ls]
  opencode providers login [url]        log in to a provider
  opencode providers logout [provider]  log out from a configured provider

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode agent --help`

退出码：`0`。

```text
opencode agent

manage agents

Commands:
  opencode agent create  create a new agent
  opencode agent list    list all available agents

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode upgrade --help`

退出码：`0`。

```text
opencode upgrade [target]

upgrade opencode to the latest or a specific version

Positionals:
  target  version to upgrade to, for ex '0.1.48' or 'v0.1.48'                               [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -m, --method      installation method to use
                          [string] [choices: "curl", "npm", "pnpm", "bun", "brew", "choco", "scoop"]
```

### `opencode uninstall --help`

退出码：`0`。

```text
opencode uninstall

uninstall opencode and remove all related files

Options:
  -h, --help         show help                                                             [boolean]
  -v, --version      show version number                                                   [boolean]
      --print-logs   print logs to stderr                                                  [boolean]
      --log-level    log level                  [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure         run without external plugins                                          [boolean]
  -c, --keep-config  keep configuration files                             [boolean] [default: false]
  -d, --keep-data    keep session data and snapshots                      [boolean] [default: false]
      --dry-run      show what would be removed without removing          [boolean] [default: false]
  -f, --force        skip confirmation prompts                            [boolean] [default: false]
```

### `opencode serve --help`

退出码：`0`。

```text
opencode serve

starts a headless opencode server

Options:
  -h, --help         show help                                                             [boolean]
  -v, --version      show version number                                                   [boolean]
      --print-logs   print logs to stderr                                                  [boolean]
      --log-level    log level                  [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure         run without external plugins                                          [boolean]
      --port         port to listen on                                         [number] [default: 0]
      --hostname     hostname to listen on                           [string] [default: "127.0.0.1"]
      --mdns         enable mDNS service discovery (defaults hostname to 0.0.0.0)
                                                                          [boolean] [default: false]
      --mdns-domain  custom domain name for mDNS service (default: opencode.local)
                                                                [string] [default: "opencode.local"]
      --cors         additional domains to allow for CORS                      [array] [default: []]
```

### `opencode web --help`

退出码：`0`。

```text
opencode web

start opencode server and open web interface

Options:
  -h, --help         show help                                                             [boolean]
  -v, --version      show version number                                                   [boolean]
      --print-logs   print logs to stderr                                                  [boolean]
      --log-level    log level                  [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure         run without external plugins                                          [boolean]
      --port         port to listen on                                         [number] [default: 0]
      --hostname     hostname to listen on                           [string] [default: "127.0.0.1"]
      --mdns         enable mDNS service discovery (defaults hostname to 0.0.0.0)
                                                                          [boolean] [default: false]
      --mdns-domain  custom domain name for mDNS service (default: opencode.local)
                                                                [string] [default: "opencode.local"]
      --cors         additional domains to allow for CORS                      [array] [default: []]
```

### `opencode models --help`

退出码：`0`。

```text
opencode models [provider]

list all available models

Positionals:
  provider  provider ID to filter models by                                                 [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --verbose     use more verbose model output (includes metadata like costs)           [boolean]
      --refresh     refresh the models cache from models.dev                               [boolean]
```

### `opencode stats --help`

退出码：`0`。

```text
opencode stats

show token usage and cost statistics

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --days        show stats for the last N days (default: all time)                      [number]
      --tools       number of tools to show (default: all)                                  [number]
      --models      show model statistics (default: hidden). Pass a number to show top N, otherwise
                    shows all
      --project     filter by project (default: all projects, empty string: current project)[string]
```

### `opencode export --help`

退出码：`0`。

```text
opencode export [sessionID]

export session data as JSON

Positionals:
  sessionID  session id to export                                                           [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --sanitize    redact sensitive transcript and file data                              [boolean]
```

### `opencode import --help`

退出码：`0`。

```text
opencode import <file>

import session data from JSON file or URL

Positionals:
  file  path to JSON file or share URL                                           [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode github --help`

退出码：`0`。

```text
opencode github

manage GitHub agent

Commands:
  opencode github install  install the GitHub agent
  opencode github run      run the GitHub agent

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode pr --help`

退出码：`0`。

```text
opencode pr <number>

fetch and checkout a GitHub PR branch, then run opencode

Positionals:
  number  PR number to checkout                                                  [number] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode session --help`

退出码：`0`。

```text
opencode session

manage sessions

Commands:
  opencode session list                list sessions
  opencode session delete <sessionID>  delete a session

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode plugin --help`

退出码：`0`。

```text
opencode plugin <module>

install plugin and update config

Positionals:
  module  npm module name                                                        [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -g, --global      install in global config                              [boolean] [default: false]
  -f, --force       replace existing plugin version                       [boolean] [default: false]
```

### `opencode db --help`

退出码：`0`。

```text
opencode db

database tools

Commands:
  opencode db [query]     open an interactive sqlite3 shell or run a query                 [default]
  opencode db path        print the database path

Positionals:
  query  SQL query to execute                                                               [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --format      Output format                 [string] [choices: "json", "tsv"] [default: "tsv"]
```

### `opencode mcp add --help`

退出码：`0`。

```text
opencode mcp add [name]

add an MCP server

Positionals:
  name  name of the MCP server                                                              [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --url         URL for a remote MCP server                                             [string]
      --env         environment variable for a local MCP server (KEY=VALUE)                  [array]
      --header      HTTP header for a remote MCP server (KEY=VALUE)                          [array]
```

### `opencode mcp list --help`

退出码：`0`。

```text
opencode mcp list

list MCP servers and their status

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode mcp auth --help`

退出码：`0`。

```text
opencode mcp auth [name]

authenticate with an OAuth-enabled MCP server

Commands:
  opencode mcp auth list  list OAuth-capable MCP servers and their auth status         [aliases: ls]

Positionals:
  name  name of the MCP server                                                              [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode mcp logout --help`

退出码：`0`。

```text
opencode mcp logout [name]

remove OAuth credentials for an MCP server

Positionals:
  name  name of the MCP server                                                              [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode mcp debug --help`

退出码：`0`。

```text
opencode mcp debug <name>

debug OAuth connection for an MCP server

Positionals:
  name  name of the MCP server                                                   [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug config --help`

退出码：`0`。

```text
opencode debug config

show resolved configuration

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug lsp --help`

退出码：`0`。

```text
opencode debug lsp

LSP debugging utilities

Commands:
  opencode debug lsp diagnostics <file>      get diagnostics for a file
  opencode debug lsp symbols <query>         search workspace symbols
  opencode debug lsp document-symbols <uri>  get symbols from a document

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug rg --help`

退出码：`0`。

```text
opencode debug rg

ripgrep debugging utilities

Commands:
  opencode debug rg files             list files using ripgrep
  opencode debug rg search <pattern>  search file contents using ripgrep

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug file --help`

退出码：`0`。

```text
opencode debug file

file system debugging utilities

Commands:
  opencode debug file read <path>     read file contents as JSON
  opencode debug file list <path>     list files in a directory
  opencode debug file search <query>  search files by query

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug scrap --help`

退出码：`0`。

```text
opencode debug scrap

list all known projects

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug skill --help`

退出码：`0`。

```text
opencode debug skill

list all available skills

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug snapshot --help`

退出码：`0`。

```text
opencode debug snapshot

snapshot debugging utilities

Commands:
  opencode debug snapshot track         track current snapshot state
  opencode debug snapshot patch <hash>  show patch for a snapshot hash
  opencode debug snapshot diff <hash>   show diff for a snapshot hash

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug startup --help`

退出码：`0`。

```text
opencode debug startup

print startup timing

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug agent --help`

退出码：`0`。

```text
opencode debug agent <name>

show agent configuration details

Positionals:
  name  Agent name                                                               [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --tool        Tool id to execute                                                      [string]
      --params      Tool params as JSON or a JS object literal                              [string]
```

### `opencode debug v2 --help`

退出码：`0`。

```text
opencode debug v2

debug v2 catalog and built-in plugins

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug info --help`

退出码：`0`。

```text
opencode debug info

show debug information

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug paths --help`

退出码：`0`。

```text
opencode debug paths

show global paths (data, config, cache, state)

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug wait --help`

退出码：`0`。

```text
opencode debug wait

wait indefinitely (for debugging)

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode providers list --help`

退出码：`0`。

```text
opencode providers list

list providers and credentials

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode providers login --help`

退出码：`0`。

```text
opencode providers login [url]

log in to a provider

Positionals:
  url  opencode auth provider                                                               [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -p, --provider    provider id or name to log in to (skips provider selection)             [string]
  -m, --method      login method label (skips method selection)                             [string]
```

### `opencode providers logout --help`

退出码：`0`。

```text
opencode providers logout [provider]

log out from a configured provider

Positionals:
  provider  provider id or name to log out from                                             [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode agent create --help`

退出码：`0`。

```text
opencode agent create

create a new agent

Options:
  -h, --help                  show help                                                    [boolean]
  -v, --version               show version number                                          [boolean]
      --print-logs            print logs to stderr                                         [boolean]
      --log-level             log level         [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure                  run without external plugins                                 [boolean]
      --path                  directory path to generate the agent file                     [string]
      --description           what the agent should do                                      [string]
      --mode                  agent mode            [string] [choices: "all", "primary", "subagent"]
      --permissions, --tools  comma-separated list of permissions to allow (default: all).
                              Available: "bash, read, edit, glob, grep, webfetch, task, todowrite,
                              websearch, lsp, skill"                                        [string]
  -m, --model                 model to use in the format of provider/model                  [string]
```

### `opencode agent list --help`

退出码：`0`。

```text
opencode agent list

list all available agents

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode github install --help`

退出码：`0`。

```text
opencode github install

install the GitHub agent

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode github run --help`

退出码：`0`。

```text
opencode github run

run the GitHub agent

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --event       GitHub mock event to run the agent for                                  [string]
      --token       GitHub personal access token (github_pat_********)                      [string]
```

### `opencode session list --help`

退出码：`0`。

```text
opencode session list

list sessions

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -n, --max-count   limit to N most recent sessions                                         [number]
      --format      output format             [string] [choices: "table", "json"] [default: "table"]
```

### `opencode session delete --help`

退出码：`0`。

```text
opencode session delete <sessionID>

delete a session

Positionals:
  sessionID  session ID to delete                                                [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode db path --help`

退出码：`0`。

```text
opencode db path

print the database path

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode mcp auth list --help`

退出码：`0`。

```text
opencode mcp auth list

list OAuth-capable MCP servers and their auth status

Positionals:
  name  name of the MCP server                                                              [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug lsp diagnostics --help`

退出码：`0`。

```text
opencode debug lsp diagnostics <file>

get diagnostics for a file

Positionals:
  file                                                                           [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug lsp symbols --help`

退出码：`0`。

```text
opencode debug lsp symbols <query>

search workspace symbols

Positionals:
  query                                                                          [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug lsp document-symbols --help`

退出码：`0`。

```text
opencode debug lsp document-symbols <uri>

get symbols from a document

Positionals:
  uri                                                                            [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug rg files --help`

退出码：`0`。

```text
opencode debug rg files

list files using ripgrep

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --query       Filter files by query                                                   [string]
      --glob        Glob pattern to match files                                             [string]
      --limit       Limit number of results                                                 [number]
```

### `opencode debug rg search --help`

退出码：`0`。

```text
opencode debug rg search <pattern>

search file contents using ripgrep

Positionals:
  pattern  Search pattern                                                        [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
      --glob        File glob patterns                                                       [array]
      --limit       Limit number of results                                                 [number]
```

### `opencode debug file read --help`

退出码：`0`。

```text
opencode debug file read <path>

read file contents as JSON

Positionals:
  path  File path to read                                                        [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug file list --help`

退出码：`0`。

```text
opencode debug file list <path>

list files in a directory

Positionals:
  path  File path to list                                                        [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug file search --help`

退出码：`0`。

```text
opencode debug file search <query>

search files by query

Positionals:
  query  Search query                                                            [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug snapshot track --help`

退出码：`0`。

```text
opencode debug snapshot track

track current snapshot state

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug snapshot patch --help`

退出码：`0`。

```text
opencode debug snapshot patch <hash>

show patch for a snapshot hash

Positionals:
  hash  hash                                                                     [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode debug snapshot diff --help`

退出码：`0`。

```text
opencode debug snapshot diff <hash>

show diff for a snapshot hash

Positionals:
  hash  hash                                                                     [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console --help`

退出码：`0`。

```text
opencode console

Commands:
  opencode console login [url]     log in to console
  opencode console logout [email]  log out from console
  opencode console switch          switch active org
  opencode console orgs            list orgs
  opencode console open            open active console account

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console login --help`

退出码：`0`。

```text
opencode console login [url]

log in to console

Positionals:
  url  server URL                                                                           [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console logout --help`

退出码：`0`。

```text
opencode console logout [email]

log out from console

Positionals:
  email  account email to log out from                                                      [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console switch --help`

退出码：`0`。

```text
opencode console switch

switch active org

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console orgs --help`

退出码：`0`。

```text
opencode console orgs

list orgs

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode console open --help`

退出码：`0`。

```text
opencode console open

open active console account

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode auth --help`

退出码：`0`。

```text
opencode providers

manage AI providers and credentials

Commands:
  opencode auth list               list providers and credentials                      [aliases: ls]
  opencode auth login [url]        log in to a provider
  opencode auth logout [provider]  log out from a configured provider

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode auth list --help`

退出码：`0`。

```text
opencode auth list

list providers and credentials

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode auth login --help`

退出码：`0`。

```text
opencode auth login [url]

log in to a provider

Positionals:
  url  opencode auth provider                                                               [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -p, --provider    provider id or name to log in to (skips provider selection)             [string]
  -m, --method      login method label (skips method selection)                             [string]
```

### `opencode auth logout --help`

退出码：`0`。

```text
opencode auth logout [provider]

log out from a configured provider

Positionals:
  provider  provider id or name to log out from                                             [string]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
```

### `opencode plug --help`

退出码：`0`。

```text
opencode plugin <module>

install plugin and update config

Positionals:
  module  npm module name                                                        [string] [required]

Options:
  -h, --help        show help                                                              [boolean]
  -v, --version     show version number                                                    [boolean]
      --print-logs  print logs to stderr                                                   [boolean]
      --log-level   log level                   [string] [choices: "DEBUG", "INFO", "WARN", "ERROR"]
      --pure        run without external plugins                                           [boolean]
  -g, --global      install in global config                              [boolean] [default: false]
  -f, --force       replace existing plugin version                       [boolean] [default: false]
```

## 一手来源与复核

- [本仓库适配代码](../../src/build-command.ts)。
- 本机 `opencode --version` 与上列全部 `--help` 输出。
- 安装包 `/usr/local/lib/node_modules/opencode-ai/package.json`。
- 安装 binary `/usr/local/lib/node_modules/opencode-ai/bin/opencode.exe` 的内嵌命令注册 JavaScript：可搜索 `command:"run [message..]"`、`command:"console"`、`hidden:!0` 复核；无需执行其 handler。

```bash
opencode --version
opencode --help
opencode run --help
opencode mcp auth --help
opencode console --help
```

升级后二进制及默认值可能改变，应重新采集帮助与 hidden 注册。本文没有使用最新版网站文档替代本机快照。
