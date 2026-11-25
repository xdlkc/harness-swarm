# kimi 命令与参数参考

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。


采集日期：2026-09-15（Asia/Shanghai）。这是本机安装版本的静态快照，不代表上游最新版本。

| 项目 | 实测值 |
| --- | --- |
| harness 名称 | `kimi` |
| 可执行命令 | `kimi` |
| PATH 解析路径 | `~/.kimi-code/bin/kimi` |
| 实际文件 | `~/.kimi-code/bin/kimi` |
| 版本命令 | `kimi -V` |
| 版本输出 | `0.41.0` |
| SHA-256 | `09419f28548178d879d0835b2bc63a184cdc42816c0ab90f515ab259dc6a9548` |

## 覆盖范围与采集方式

逐层读取根命令和每个可发现子命令的 `--help`，保留完整标准输出及非空标准错误；所有以下成功快照的退出码均为 `0`。只执行版本和帮助查询，未执行模型任务、登录、安装、升级、删除、配置写入或服务启动。帮助文本本身描述的操作不表示这些操作已被执行。

CLI 参数、交互式 slash 命令、模型工具和配置字段属于不同接口；下面分别记录。`--help` 中给出的类型、默认值、别名和重复参数语法均按本机原文保留。完整性限于此版本可通过帮助和下文说明的本地证据发现的接口；项目/插件动态注册的命令不可能由静态 CLI 帮助穷举。

## 命令索引

- [`kimi`](#command-0)
- [`kimi export`](#command-1)
- [`kimi fork`](#command-2)
- [`kimi provider`](#command-3)
- [`kimi session`](#command-4)
- [`kimi acp`](#command-5)
- [`kimi web`](#command-6)
- [`kimi server`](#command-7)
- [`kimi login`](#command-8)
- [`kimi doctor`](#command-9)
- [`kimi vis`](#command-10)
- [`kimi migrate`](#command-11)
- [`kimi upgrade`](#command-12)
- [`kimi provider add`](#command-13)
- [`kimi provider remove`](#command-14)
- [`kimi provider list`](#command-15)
- [`kimi provider catalog`](#command-16)
- [`kimi provider help`](#command-17)
- [`kimi session list`](#command-18)
- [`kimi session help`](#command-19)
- [`kimi web rotate-token`](#command-20)
- [`kimi server kill`](#command-21)
- [`kimi doctor config`](#command-22)
- [`kimi doctor tui`](#command-23)
- [`kimi update`](#command-24)
- [`kimi provider catalog list`](#command-25)
- [`kimi provider catalog add`](#command-26)
- [`kimi provider catalog help`](#command-27)
- [`kimi rc`](#command-28)
- [`kimi remote`](#command-29)
- [`kimi __plugin_run_node`](#command-30)
- [`kimi __update_download`](#command-31)

<a id="command-0"></a>

## `kimi`

采集：`kimi --help`。

```text
Usage: kimi [options] [command]

The Starting Point for Next-Gen Agents

Options:
  -V, --version                 output the version number
  -S, --session [id]            Resume a session. With ID: resume that session. Without ID:
                                interactively pick.
  -c, --continue                Continue the previous session for the working directory. (default:
                                false)
  -y, --yolo                    Start in Ask When Needed mode: routine edits and commands run
                                automatically; risky actions, questions, and plans still ask.
                                (default: false)
  --auto                        Start in Never Ask mode: never interrupts you; everything runs and
                                is decided automatically. (default: false)
  -m, --model <model>           LLM model alias to use for this invocation. Defaults to
                                default_model in config.toml.
  -p, --prompt <prompt>         Run one prompt non-interactively and print the response.
  --output-format <format>      Output format for prompt mode. Defaults to text. (choices: "text",
                                "stream-json")
  --skills-dir <dir>            Load skills from this directory instead of auto-discovered user and
                                project directories. Can be repeated. (default: [])
  --agent <name>                Agent profile to start the new session with. Custom profiles are
                                discovered from agent directories or loaded via --agent-file. Cannot
                                be combined with --session/--continue.
  --agent-file <path>           Load an agent definition from a Markdown file and select it for the
                                new session. Cannot be combined with --session/--continue. (default:
                                [])
  --add-dir <dir>               Add an additional workspace directory for this session. Can be
                                repeated. (default: [])
  --plan                        Start in plan mode. (default: false)
  -h, --help                    Show help.

Commands:
  export [options] [sessionId]  Export a session as a ZIP archive.
  fork [options] [sessionId]    Fork a session into a new session.
  provider                      Manage LLM providers non-interactively.
  session                       Manage sessions non-interactively.
  acp [options]                 Run kimi-code as an Agent Client Protocol (ACP) server over stdio.
  web [options]                 Run the local Kimi server and open the web UI.
  server                        Deprecated — use `kimi web` instead.
  login [options]               Authenticate with Kimi Code CLI via the device-code flow.
  doctor                        Validate Kimi Code configuration files.
  vis [options] [sessionId]     Launch the session visualizer in your browser.
  migrate [options]             Migrate data from a legacy kimi-cli installation into kimi-code.
  upgrade|update                Upgrade Kimi Code to the latest version.

Documentation:        https://moonshotai.github.io/kimi-code/
```

<a id="command-1"></a>

## `kimi export`

采集：`kimi export --help`。

```text
Usage: kimi export [options] [sessionId]

Export a session as a ZIP archive.

Arguments:
  sessionId                Session id to export. Defaults to the most recent session.

Options:
  -o, --output <path>      Output ZIP path.
  -y, --yes                Skip previous-session confirmation.
  --no-include-global-log  Skip bundling the active global diagnostic log
                           (~/.kimi-code/logs/kimi-code.log, not rotated .1 files). By default the
                           global log is included.
  -h, --help               Show help.
```

<a id="command-2"></a>

## `kimi fork`

采集：`kimi fork --help`。

```text
Usage: kimi fork [options] [sessionId]

Fork a session into a new session.

Arguments:
  sessionId     Session id to fork. Defaults to the most recent session.

Options:
  --cwd <path>  Working directory used to find the most recent session to fork. Defaults to the
                current directory.
  -y, --yes     Skip previous-session confirmation.
  -h, --help    Show help.
```

<a id="command-3"></a>

## `kimi provider`

采集：`kimi provider --help`。

```text
Usage: kimi provider [options] [command]

Manage LLM providers non-interactively.

Options:
  -h, --help           Show help.

Commands:
  add [options] <url>  Import every provider listed in a custom registry (api.json).
  remove <providerId>  Remove a provider and every model alias that referenced it.
  list [options]       Show configured providers and their model counts.
  catalog              Discover and import providers from the public models.dev catalog.
  help [command]       display help for command
```

<a id="command-4"></a>

## `kimi session`

采集：`kimi session --help`。

```text
Usage: kimi session [options] [command]

Manage sessions non-interactively.

Options:
  -h, --help      Show help.

Commands:
  list [options]  List sessions, most recently updated first.
  help [command]  display help for command
```

<a id="command-5"></a>

## `kimi acp`

采集：`kimi acp --help`。

```text
Usage: kimi acp [options]

Run kimi-code as an Agent Client Protocol (ACP) server over stdio.

Options:
  --login            Run the device-code login flow then exit (entry point for ACP terminal-auth).
                     (default: false)
  --region <region>  Login region used together with --login: "mainland-cn" (kimi.com) or "global"
                     (kimi.ai).
  -h, --help         Show help.
```

<a id="command-6"></a>

## `kimi web`

采集：`kimi web --help`。

```text
Usage: kimi web [options] [command]

Run the local Kimi server and open the web UI.

Options:
  --port <port>             Bind port (default 58627) (default: "58627")
  --host [host]             Bind host. Omit to bind 127.0.0.1 (this machine only); pass --host to
                            bind 0.0.0.0 (all interfaces), or --host <host> for a specific host. The
                            bearer token is printed at startup.
  --allowed-host <host...>  Extra Host header value to allow through the DNS-rebinding check. Repeat
                            or comma-separate; a leading dot matches a domain suffix (e.g.
                            .example.com).
  --insecure-no-tls         Allow a non-loopback bind without a TLS-terminating reverse proxy.
                            Defaults to true; only relevant for non-loopback binds. (default: true)
  --allow-remote-shutdown   On a non-loopback bind, keep POST /api/v1/shutdown enabled (default:
                            route is disabled → 404). (default: false)
  --dangerous-bypass-auth   Disable bearer-token auth on every REST and WebSocket route, and
                            advertise it via /api/v1/meta so the web UI connects without a token.
                            Only use on a trusted network or behind your own authenticating proxy.
                            (default: false)
  --log-level <level>       Server log level: fatal|error|warn|info|debug|trace|silent. Omit to keep
                            logs off.
  --debug-endpoints         Mount /api/v1/debug/* routes for test introspection. OFF by default;
                            production callers leave this unset. (default: false)
  --web-title <title>       Set a custom browser tab title for this web UI instance (default:
                            "<workspace dir> | Kimi Code").
  --no-open                 Do not open the web UI in the default browser.
  -h, --help                Show help.

Commands:
  rotate-token              Generate a new persistent server token; the previous token stops working
                            immediately.
```

<a id="command-7"></a>

## `kimi server`

采集：`kimi server --help`。

```text
Usage: kimi server [options] [command]

Deprecated — use `kimi web` instead.

Options:
  -h, --help  Show help.

Commands:
  kill        Deprecated — stop a server started by a version before 0.28.0 (recorded in the legacy
              server lock). Servers started by `kimi web` run in the foreground — stop them with
              Ctrl+C.
```

<a id="command-8"></a>

## `kimi login`

采集：`kimi login --help`。

```text
Usage: kimi login [options]

Authenticate with Kimi Code CLI via the device-code flow.

Options:
  --region <region>  Login region: "mainland-cn" (kimi.com) or "global" (kimi.ai).
  -h, --help         Show help.
```

<a id="command-9"></a>

## `kimi doctor`

采集：`kimi doctor --help`。

```text
Usage: kimi doctor [options] [command]

Validate Kimi Code configuration files.

Options:
  -h, --help     Show help.

Commands:
  config [path]  Validate config.toml.
  tui [path]     Validate tui.toml.
```

<a id="command-10"></a>

## `kimi vis`

采集：`kimi vis --help`。

```text
Usage: kimi vis [options] [sessionId]

Launch the session visualizer in your browser.

Arguments:
  sessionId        Open directly to this session.

Options:
  --port <number>  Port to bind. Default: auto-pick a free port.
  --host <host>    Host to bind. Default: 127.0.0.1.
  --no-open        Do not open the browser automatically.
  -h, --help       Show help.
```

<a id="command-11"></a>

## `kimi migrate`

采集：`kimi migrate --help`。

```text
Usage: kimi migrate [options]

Migrate data from a legacy kimi-cli installation into kimi-code.

Options:
  --run          Run the migration non-interactively and print step-by-step logs. Migrates
                 everything unless --config-only is also given. (default: false)
  --config-only  With --run: migrate config, MCP servers, REPL history and skills, but skip chat
                 sessions. (default: false)
  -h, --help     Show help.
```

<a id="command-12"></a>

## `kimi upgrade`

采集：`kimi upgrade --help`。

```text
Usage: kimi upgrade|update [options]

Upgrade Kimi Code to the latest version.

Options:
  -h, --help  Show help.
```

<a id="command-13"></a>

## `kimi provider add`

采集：`kimi provider add --help`。

```text
Usage: kimi provider add [options] <url>

Import every provider listed in a custom registry (api.json).

Options:
  --api-key <key>  Registry API key. Falls back to KIMI_REGISTRY_API_KEY.
  -h, --help       Show help.
```

<a id="command-14"></a>

## `kimi provider remove`

采集：`kimi provider remove --help`。

```text
Usage: kimi provider remove [options] <providerId>

Remove a provider and every model alias that referenced it.

Options:
  -h, --help  Show help.
```

<a id="command-15"></a>

## `kimi provider list`

采集：`kimi provider list --help`。

```text
Usage: kimi provider list [options]

Show configured providers and their model counts.

Options:
  --json      Emit the raw providers/models config as JSON. (default: false)
  -h, --help  Show help.
```

<a id="command-16"></a>

## `kimi provider catalog`

采集：`kimi provider catalog --help`。

```text
Usage: kimi provider catalog [options] [command]

Discover and import providers from the public models.dev catalog.

Options:
  -h, --help                   Show help.

Commands:
  list [options] [providerId]  List providers in the catalog, or models when a providerId is given.
  add [options] <providerId>   Import a known provider from the catalog by id.
  help [command]               display help for command
```

<a id="command-17"></a>

## `kimi provider help`

采集：`kimi provider help --help`。

```text
Usage: kimi provider [options] [command]

Manage LLM providers non-interactively.

Options:
  -h, --help           Show help.

Commands:
  add [options] <url>  Import every provider listed in a custom registry (api.json).
  remove <providerId>  Remove a provider and every model alias that referenced it.
  list [options]       Show configured providers and their model counts.
  catalog              Discover and import providers from the public models.dev catalog.
  help [command]       display help for command
```

<a id="command-18"></a>

## `kimi session list`

采集：`kimi session list --help`。

```text
Usage: kimi session list [options]

List sessions, most recently updated first.

Options:
  --cwd <path>  List sessions of this working directory. Defaults to the current directory.
  --all         List sessions across every workspace. (default: false)
  --archived    Include archived sessions. (default: false)
  --limit <n>   Print at most n sessions.
  --json        Emit the session summaries as JSON. (default: false)
  -h, --help    Show help.
```

<a id="command-19"></a>

## `kimi session help`

采集：`kimi session help --help`。

```text
Usage: kimi session [options] [command]

Manage sessions non-interactively.

Options:
  -h, --help      Show help.

Commands:
  list [options]  List sessions, most recently updated first.
  help [command]  display help for command
```

<a id="command-20"></a>

## `kimi web rotate-token`

采集：`kimi web rotate-token --help`。

```text
Usage: kimi web rotate-token [options]

Generate a new persistent server token; the previous token stops working immediately.

Options:
  -h, --help  Show help.
```

<a id="command-21"></a>

## `kimi server kill`

采集：`kimi server kill --help`。

```text
Usage: kimi server kill [options]

Deprecated — stop a server started by a version before 0.28.0 (recorded in the legacy server lock).
Servers started by `kimi web` run in the foreground — stop them with Ctrl+C.

Options:
  -h, --help  Show help.
```

<a id="command-22"></a>

## `kimi doctor config`

采集：`kimi doctor config --help`。

```text
Usage: kimi doctor config [options] [path]

Validate config.toml.

Arguments:
  path        Validate this file as config.toml instead of the default path.

Options:
  -h, --help  Show help.
```

<a id="command-23"></a>

## `kimi doctor tui`

采集：`kimi doctor tui --help`。

```text
Usage: kimi doctor tui [options] [path]

Validate tui.toml.

Arguments:
  path        Validate this file as tui.toml instead of the default path.

Options:
  -h, --help  Show help.
```

<a id="command-24"></a>

## `kimi update`

采集：`kimi update --help`。

```text
Usage: kimi upgrade|update [options]

Upgrade Kimi Code to the latest version.

Options:
  -h, --help  Show help.
```

<a id="command-25"></a>

## `kimi provider catalog list`

采集：`kimi provider catalog list --help`。

```text
Usage: kimi provider catalog list [options] [providerId]

List providers in the catalog, or models when a providerId is given.

Options:
  --filter <substring>  Case-insensitive id/name substring filter.
  --url <url>           Override catalog URL. Defaults to https://models.dev/api.json.
  --json                Emit the matching catalog slice as JSON. (default: false)
  -h, --help            Show help.
```

<a id="command-26"></a>

## `kimi provider catalog add`

采集：`kimi provider catalog add --help`。

```text
Usage: kimi provider catalog add [options] <providerId>

Import a known provider from the catalog by id.

Options:
  --api-key <key>            API key for the provider. Falls back to KIMI_REGISTRY_API_KEY.
  --default-model <modelId>  Mark the imported model as default_model after import.
  --base-url <url>           Override the catalog endpoint. Required when the catalog declares none
                             (or an env placeholder).
  --url <url>                Override catalog URL. Defaults to https://models.dev/api.json.
  -h, --help                 Show help.
```

<a id="command-27"></a>

## `kimi provider catalog help`

采集：`kimi provider catalog help --help`。

```text
Usage: kimi provider catalog [options] [command]

Discover and import providers from the public models.dev catalog.

Options:
  -h, --help                   Show help.

Commands:
  list [options] [providerId]  List providers in the catalog, or models when a providerId is given.
  add [options] <providerId>   Import a known provider from the catalog by id.
  help [command]               display help for command
```

<a id="command-28"></a>

## `kimi rc`

采集：`kimi rc --help`。

```text
Usage: kimi rc|remote [options]

Run the local Kimi server and open the web UI through Remote Control (experimental).

Options:
  --port <port>             Bind port (default 58627) (default: "58627")
  --host [host]             Bind host. Omit to bind 127.0.0.1 (this machine only); pass --host to
                            bind 0.0.0.0 (all interfaces), or --host <host> for a specific host. The
                            bearer token is printed at startup.
  --allowed-host <host...>  Extra Host header value to allow through the DNS-rebinding check. Repeat
                            or comma-separate; a leading dot matches a domain suffix (e.g.
                            .example.com).
  --insecure-no-tls         Allow a non-loopback bind without a TLS-terminating reverse proxy.
                            Defaults to true; only relevant for non-loopback binds. (default: true)
  --allow-remote-shutdown   On a non-loopback bind, keep POST /api/v1/shutdown enabled (default:
                            route is disabled → 404). (default: false)
  --dangerous-bypass-auth   Disable bearer-token auth on every REST and WebSocket route, and
                            advertise it via /api/v1/meta so the web UI connects without a token.
                            Only use on a trusted network or behind your own authenticating proxy.
                            (default: false)
  --log-level <level>       Server log level: fatal|error|warn|info|debug|trace|silent. Omit to keep
                            logs off.
  --debug-endpoints         Mount /api/v1/debug/* routes for test introspection. OFF by default;
                            production callers leave this unset. (default: false)
  --web-title <title>       Set a custom browser tab title for this web UI instance (default:
                            "<workspace dir> | Kimi Code").
  --no-open                 Do not open the web UI in the default browser.
  -h, --help                Show help.
```

<a id="command-29"></a>

## `kimi remote`

采集：`kimi remote --help`。

```text
Usage: kimi rc|remote [options]

Run the local Kimi server and open the web UI through Remote Control (experimental).

Options:
  --port <port>             Bind port (default 58627) (default: "58627")
  --host [host]             Bind host. Omit to bind 127.0.0.1 (this machine only); pass --host to
                            bind 0.0.0.0 (all interfaces), or --host <host> for a specific host. The
                            bearer token is printed at startup.
  --allowed-host <host...>  Extra Host header value to allow through the DNS-rebinding check. Repeat
                            or comma-separate; a leading dot matches a domain suffix (e.g.
                            .example.com).
  --insecure-no-tls         Allow a non-loopback bind without a TLS-terminating reverse proxy.
                            Defaults to true; only relevant for non-loopback binds. (default: true)
  --allow-remote-shutdown   On a non-loopback bind, keep POST /api/v1/shutdown enabled (default:
                            route is disabled → 404). (default: false)
  --dangerous-bypass-auth   Disable bearer-token auth on every REST and WebSocket route, and
                            advertise it via /api/v1/meta so the web UI connects without a token.
                            Only use on a trusted network or behind your own authenticating proxy.
                            (default: false)
  --log-level <level>       Server log level: fatal|error|warn|info|debug|trace|silent. Omit to keep
                            logs off.
  --debug-endpoints         Mount /api/v1/debug/* routes for test introspection. OFF by default;
                            production callers leave this unset. (default: false)
  --web-title <title>       Set a custom browser tab title for this web UI instance (default:
                            "<workspace dir> | Kimi Code").
  --no-open                 Do not open the web UI in the default browser.
  -h, --help                Show help.
```

<a id="command-30"></a>

## `kimi __plugin_run_node`

采集：`kimi __plugin_run_node --help`。

```text
Usage: kimi __plugin_run_node [options] <entry> [args...]

Options:
  -h, --help  Show help.
```

<a id="command-31"></a>

## `kimi __update_download`

采集：`kimi __update_download --help`。

```text
Usage: kimi __update_download [options] <version>

Options:
  --manual    the stage answers an explicit user-initiated upgrade
  -h, --help  Show help.
```

## 本机嵌入源码发现的隐藏参数与命令

本机 Mach-O 二进制中保留了带 `//#region` 路径标记的 JavaScript。以下内容读取自与上面 SHA-256 完全相同的文件，没有执行这些功能；可搜索 `src/cli/commands.ts`、`src/cli/sub/web/index.ts`、`src/cli/sub/web/run.ts` 复核。

| 作用域 | 隐藏入口 | 本机实现语义 |
| --- | --- | --- |
| 根命令 | `-r, --resume [id]` | 兼容会话恢复入口；`--session` 优先于 `--resume` |
| 根命令 | `-C` | 等价于 `--continue`，默认 false |
| 根命令 | `--yes`、`--auto-approve` | 合并进 yolo/Ask When Needed，不等价于 `--auto` |
| `web` | `--rc, --remote-control` | 默认 false；实验功能未启用时从帮助隐藏，执行时仍检查功能开关 |
| 根子命令 | `rc`（别名 `remote`） | 使用 web 的选项启动 Remote Control；当前根帮助隐藏，上方已保存独立帮助 |
| 根子命令 | `__plugin_run_node <entry> [args...]` | 内部插件 Node runner，可接受未知尾部选项；不是模型任务入口 |
| 根子命令 | `__update_download <version> [--manual]` | 内部更新下载入口；`--manual` 表示响应显式升级；本次只查帮助 |

`--agent-file` 虽在帮助中显示数组默认值 `[]`，本机解析器明确限制它只能给一次；`--agent` 同样只能给一次，而且两者互斥。不要据数组展示推断可以重复传它。

## 本机交互式 slash 注册表

以下注册表读取自二进制嵌入的 `src/tui/commands/registry.ts`。这是 TUI 入口，不是 shell 子命令；除下节 Goal 创建特例外，不应把它们视为 `-p` 的控制 API。无参数提示表示注册表没有声明固定参数语法，并不证明处理函数拒绝所有额外文本。实验开关、引擎和会话状态可能限制可用性。

| 命令 | 别名 | 参数提示/用途（本机注册文本） | 限制 |
| --- | --- | --- | --- |
| `/yolo` | `/yes` | Ask When Needed mode: routine edits and commands run automatically; risky actions, questions, and plans still ask. | — |
| `/auto` | — | Never Ask mode: never interrupts you; everything runs and is decided automatically. | — |
| `/permission` | — | Select permission mode | — |
| `/settings` | `/config` | Open TUI settings | — |
| `/plan` | — | Toggle plan mode | — |
| `/swarm` | — | [on\|off] \| <task>；Toggle swarm mode or run one task in swarm mode | — |
| `/tower` | — | [status\|teardown\|on\|off] \| <base-branch>；Report tower status, toggle tower mode, or turn it on with a base branch | experimental tower；engine v2 |
| `/model` | — | Switch LLM model | — |
| `/secondary-model` | `/subagent-model` | Configure the secondary model for subagents | experimental secondary-model |
| `/effort` | `/thinking` | Switch thinking effort | — |
| `/provider` | `/providers` | Manage AI providers (add / delete / refresh) | — |
| `/btw` | — | Ask a forked side agent a question | — |
| `/help` | `/h`、`/?` | Show available commands and shortcuts | — |
| `/new` | `/clear` | Start a fresh session in the current workspace | — |
| `/sessions` | `/resume` | Browse and resume sessions | — |
| `/tasks` | `/task` | Browse background tasks | — |
| `/mcp` | — | Show MCP server status | — |
| `/plugins` | — | Manage plugins | — |
| `/add-dir` | — | [list] \| <path>；Add or list an additional workspace directory | — |
| `/experiments` | `/experimental` | Manage experimental features | — |
| `/reload` | — | Reload session and apply config.toml settings plus tui.toml UI preferences | — |
| `/reload-tui` | — | Reload only tui.toml UI preferences | — |
| `/compact` | — | <instruction>；Compact the conversation context | — |
| `/goal` | — | [status\|pause\|resume\|cancel\|replace\|next] \| <objective>；Start or manage an autonomous goal | — |
| `/init` | — | Analyze the codebase and generate AGENTS.md | — |
| `/fork` | — | Fork the current session into a copy without switching to it | — |
| `/title` | `/rename` | <title>；Set or show session title | — |
| `/usage` | — | Show session tokens + context window + plan quotas | — |
| `/status` | — | Show current session and runtime status | — |
| `/feedback` | `/bug` | Send feedback to make Kimi Code better | — |
| `/undo` | — | Withdraw the last prompt from the transcript | — |
| `/editor` | — | Set the external editor for Ctrl-G | — |
| `/theme` | — | Set the terminal UI theme | — |
| `/logout` | `/disconnect` | Log out of a configured provider | — |
| `/login` | — | Select a platform and authenticate | — |
| `/export-md` | `/export` | Export current session as a Markdown file | — |
| `/export-debug-zip` | — | Export current session as a debug ZIP archive | — |
| `/copy` | — | Copy the last assistant message to the clipboard | — |
| `/web` | — | Open the current session in the Web UI by starting a new server | — |
| `/remote-control` | `/rc` | Open the current session through Kimi Remote Control (experimental) | experimental remote-control |
| `/exit` | `/quit`、`/q` | Exit the application | — |
| `/version` | — | Show version information | — |

处理函数补充：`/model [alias]`、`/secondary-model [alias]` 会打开模型选择器；`/effort [value]`（别名 `/thinking`）按模型支持的 effort 值验证，未传值时打开选择器，没有固定通用枚举。`/undo [count]` 接受正整数；`/plan [on|off|clear]` 控制计划状态；`/plugins` 还支持 `list`、`install <local-path-or-zip-url>`、`marketplace [source]`、`info <id>`、`mcp enable|disable <id> <server>`、`enable <id>`、`disable <id>`、`remove <id>`、`reload`。它们来自 `src/tui/commands/config.ts`、`undo.ts`、`plugins.ts` 等本机嵌入实现。

内置 Skill、外部 Skill 和插件还会动态添加 `/name`、`/skill:name` 或插件命令；该表只穷举内置 TUI 注册表，不复制本机私人 Skill/插件清单。

## Goal、预算和非交互行为

本机 `src/tui/commands/goal.ts` 与 `src/cli/goal-prompt.ts` 共同确认：

| 入口 | 语义 |
| --- | --- |
| `/goal <objective>` | 创建目标；目标最多 4000 个字符 |
| `/goal -- <objective>` | 目标开头是保留子命令词时，用 `--` 分隔 |
| `/goal replace [--] <objective>` | 替换目标；解析为创建请求的 replace=true |
| `/goal`、`/goal status` | 查询目标 |
| `/goal pause`、`/goal resume`、`/goal cancel` | 暂停、恢复、取消 |
| `/goal next [--] <objective>` | 排队下一个目标 |
| `/goal next manage` | 打开待办目标管理器 |

`kimi -p` 会识别创建型语法（包括 `replace`）；其他管理型语法不由 headless 处理，落回普通 prompt，不能当作可靠的管理命令。Goal 模式输出 `goal.summary`；完成退出码 `0`，阻塞 `3`，暂停 `6`。这是本机源码核验，没有真实模型任务验证。

根 CLI 没有 `--goal`、`--max-turns`、通用费用预算或 token budget 参数。Goal 的自然语言停止条件可以写入 objective；它不是独立 CLI 硬预算开关。二进制还包含 `CreateGoal`、`GetGoal`、`SetGoalBudget`、`UpdateGoal` 模型工具和配置层的 loop control；工具字段与配置字段不能当作 argv 参数传递。本仓库尚无专门 Goal 管理和预算映射。

## 官方资料与版本边界

本机根帮助指向 [Kimi Code 官方文档](https://moonshotai.github.io/kimi-code/)，不是旧的 `kimi-cli` 文档。2026-09-15 查看了[官方 slash 参考](https://moonshotai.github.io/kimi-code/en/reference/slash-commands.html)和[Goal 指南](https://moonshotai.github.io/kimi-code/en/guides/goals.html)；现行文档同样说明 prompt 模式只能创建 Goal。本文命令和隐藏项以本机 0.41.0 为准，上游网页没有绑定此二进制版本，新增或不同描述不自动覆盖本机证据。
