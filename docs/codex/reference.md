# codex 命令与参数参考

格式说明：帮助快照保留完整参数文本，仅去除终端控制字符与行末空白。

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。

采集日期：2026-09-15（Asia/Shanghai）。版本：`codex-cli 0.154.0`。
- 可执行入口：`/usr/local/bin/codex`
- 解析后路径：`/usr/local/lib/node_modules/@openai/codex/bin/codex.js`
- 版本命令：`codex --version`
- 平台：macOS；其他平台的条件命令不属于本机帮助快照。
## 范围与证据
以下完整收录本机根帮助和递归公开子命令帮助，并补充已经发现的隐藏入口，共 **80 个帮助采集节点**。每节注明实际执行命令和退出码；帮助返回成功只证明该帮助入口可读，不证明凭据、模型调用或对应操作执行成功。
仅执行版本和帮助查询，没有执行登录、安装、更新、删除、模型任务或云端调度。别名以父级帮助中列出的名称为准，不重复复制同一命令帮助。`help [command ...]` 是帮助导航，可用各节点 `--help` 获取相同信息；不把它递归展开为无限组合。`[x]` 表示可选，`<x>` 表示值或位置参数，`...` 表示可重复，具体默认值、枚举及限制保留在原始输出中。
这里的“全部参数”指版本化 CLI 帮助公开的完整参数面，另附已找到的隐藏参数。扩展/插件自定义命令、账号开关控制的入口及未公开内部协议无法仅靠 `--help` 穷尽；配置文件键、环境变量和会话内 `/` 命令另列来源，不冒充 CLI flags。
## 命令索引
- [codex](#cmd-0)
- [codex agents](#cmd-1)
- [codex exec](#cmd-2)
- [codex review](#cmd-3)
- [codex login](#cmd-4)
- [codex logout](#cmd-5)
- [codex mcp](#cmd-6)
- [codex plugin](#cmd-7)
- [codex app-server](#cmd-8)
- [codex remote-control](#cmd-9)
- [codex app](#cmd-10)
- [codex completion](#cmd-11)
- [codex update](#cmd-12)
- [codex doctor](#cmd-13)
- [codex sandbox](#cmd-14)
- [codex debug](#cmd-15)
- [codex apply](#cmd-16)
- [codex resume](#cmd-17)
- [codex queue](#cmd-18)
- [codex archive](#cmd-19)
- [codex delete](#cmd-20)
- [codex migrate-rollouts](#cmd-21)
- [codex unarchive](#cmd-22)
- [codex fork](#cmd-23)
- [codex cloud](#cmd-24)
- [codex exec-server](#cmd-25)
- [codex features](#cmd-26)
- [codex exec resume](#cmd-27)
- [codex exec fork](#cmd-28)
- [codex exec review](#cmd-29)
- [codex login status](#cmd-30)
- [codex mcp list](#cmd-31)
- [codex mcp get](#cmd-32)
- [codex mcp add](#cmd-33)
- [codex mcp remove](#cmd-34)
- [codex mcp login](#cmd-35)
- [codex mcp logout](#cmd-36)
- [codex plugin add](#cmd-37)
- [codex plugin list](#cmd-38)
- [codex plugin marketplace](#cmd-39)
- [codex plugin remove](#cmd-40)
- [codex app-server daemon](#cmd-41)
- [codex app-server proxy](#cmd-42)
- [codex app-server generate-ts](#cmd-43)
- [codex app-server generate-json-schema](#cmd-44)
- [codex remote-control start](#cmd-45)
- [codex remote-control stop](#cmd-46)
- [codex remote-control pair](#cmd-47)
- [codex debug models](#cmd-48)
- [codex debug app-server](#cmd-49)
- [codex debug prompt-input](#cmd-50)
- [codex cloud exec](#cmd-51)
- [codex cloud status](#cmd-52)
- [codex cloud list](#cmd-53)
- [codex cloud apply](#cmd-54)
- [codex cloud diff](#cmd-55)
- [codex exec-server forward](#cmd-56)
- [codex features list](#cmd-57)
- [codex features enable](#cmd-58)
- [codex features disable](#cmd-59)
- [codex plugin marketplace add](#cmd-60)
- [codex plugin marketplace list](#cmd-61)
- [codex plugin marketplace upgrade](#cmd-62)
- [codex plugin marketplace remove](#cmd-63)
- [codex app-server daemon bootstrap](#cmd-64)
- [codex app-server daemon start](#cmd-65)
- [codex app-server daemon restart](#cmd-66)
- [codex app-server daemon enable-remote-control](#cmd-67)
- [codex app-server daemon disable-remote-control](#cmd-68)
- [codex app-server daemon stop](#cmd-69)
- [codex app-server daemon version](#cmd-70)
- [codex debug app-server send-message-v2](#cmd-71)
- [codex execpolicy](#cmd-72)（补充入口）
- [codex execpolicy check](#cmd-73)（补充入口）
- [codex responses-api-proxy](#cmd-74)（补充入口）
- [codex stdio-to-uds](#cmd-75)（补充入口）
- [codex debug trace-reduce](#cmd-76)（补充入口）
- [codex debug clear-memories](#cmd-77)（补充入口）
- [codex app-server generate-internal-json-schema](#cmd-78)（补充入口）
- [codex app-server daemon pid-update-loop](#cmd-79)（补充入口）

## 原始帮助快照

<a id="cmd-0"></a>

### `codex`
采集：`codex --help`；退出码：`0`。

````text
Codex CLI

If no subcommand is specified, options will be forwarded to the interactive CLI.

Usage: codex [OPTIONS] [PROMPT]
       codex [OPTIONS] <COMMAND> [ARGS]

Commands:
  agents            Browse all agent sessions on the shared local app-server daemon
  exec              Run Codex non-interactively [aliases: e]
  review            Run a code review non-interactively
  login             Manage login
  logout            Remove stored authentication credentials
  mcp               Manage external MCP servers for Codex
  plugin            Manage Codex plugins
  app-server        [experimental] Run the app server or related tooling
  remote-control    [experimental] Manage the app-server daemon with remote control enabled
  app               Launch the Desktop app (opens the app installer if missing)
  completion        Generate shell completion scripts
  update            Update Codex to the latest version
  doctor            Diagnose local Codex installation, config, auth, and runtime health
  sandbox           Run commands within a Codex-provided sandbox
  debug             Debugging tools
  apply             Apply the latest diff produced by Codex agent as a `git apply` to your local
                    working tree [aliases: a]
  resume            Resume a previous interactive session (picker by default; use --last to continue
                    the most recent)
  queue             Queue a message for an existing session
  archive           Archive a saved session by id or session name
  delete            Permanently delete a saved session by id or session name
  migrate-rollouts  Inspect or migrate legacy local sessions to paginated thread history
  unarchive         Unarchive a saved session by id or session name
  fork              Fork a previous interactive session (picker by default; use --last to fork the
                    most recent)
  cloud             [EXPERIMENTAL] Browse tasks from Codex Cloud and apply changes locally
  exec-server       [EXPERIMENTAL] Run the standalone exec-server service
  features          Inspect feature flags
  help              Print this message or the help of the given subcommand(s)

Arguments:
  [PROMPT]
          Optional user prompt to start the session

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

  -a, --ask-for-approval <APPROVAL_POLICY>
          Configure when the model requires human approval before executing a command

          Possible values:
          - on-request: The model decides when to ask the user for approval
          - never:      Never ask for user approval Execution failures are immediately returned to
            the model

      --search
          Enable live web search. When enabled, the native Responses `web_search` tool is available
          to the model (no per‑call approval)

      --no-alt-screen
          Disable alternate screen mode

          Runs the TUI in inline mode, preserving terminal scrollback history.

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
````

<a id="cmd-1"></a>

### `codex agents`
采集：`codex agents --help`；退出码：`0`。

````text
Browse all agent sessions on the shared local app-server daemon

Usage: codex agents [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

  -C, --cd <DIR>
          Use this directory for new tasks on a remote server

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --no-alt-screen
          Disable alternate screen mode

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-2"></a>

### `codex exec`
采集：`codex exec --help`；退出码：`0`。

````text
Run Codex non-interactively

Usage: codex exec [OPTIONS] [PROMPT]
       codex exec [OPTIONS] <COMMAND> [ARGS]

Commands:
  resume  Resume a previous session by id or pick the most recent with --last
  fork    Fork a previous session by id into a new session
  review  Run a code review against the current repository
  help    Print this message or the help of the given subcommand(s)

Arguments:
  [PROMPT]
          Initial instructions for the agent. If not provided as an argument (or if `-` is used),
          instructions are read from stdin. If stdin is piped and a prompt is also provided, stdin
          is appended as a `<stdin>` block

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --thread-source <SOURCE>
          Source classification for newly created or forked threads

      --skip-git-repo-check
          Allow running Codex outside a Git repository

      --ephemeral
          Run without persisting session files to disk

      --ignore-user-config
          Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`

      --ignore-rules
          Do not load user or project execpolicy `.rules` files

      --output-schema <FILE>
          Path to a JSON Schema file describing the model's final response shape

      --color <COLOR>
          Specifies color settings for use in the output

          [default: auto]
          [possible values: always, never, auto]

      --json
          Print events to stdout as JSONL

  -o, --output-last-message <FILE>
          Specifies file where the last message from the agent should be written

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
````

<a id="cmd-3"></a>

### `codex review`
采集：`codex review --help`；退出码：`0`。

````text
Run a code review non-interactively

Usage: codex review [OPTIONS] [PROMPT]

Arguments:
  [PROMPT]
          Custom review instructions. If `-` is used, read from stdin

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --uncommitted
          Review staged, unstaged, and untracked changes

      --base <BRANCH>
          Review changes against the given base branch

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --commit <SHA>
          Review the changes introduced by a commit

      --title <TITLE>
          Optional commit title to display in the review summary

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-4"></a>

### `codex login`
采集：`codex login --help`；退出码：`0`。

````text
Manage login

Usage: codex login [OPTIONS] [COMMAND]

Commands:
  status  Show login status
  help    Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --with-api-key
          Read the API key from stdin (e.g. `printenv OPENAI_API_KEY | codex login --with-api-key`)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --with-access-token
          Read the access token from stdin (e.g. `printenv CODEX_ACCESS_TOKEN | codex login
          --with-access-token`)

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --device-auth


  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-5"></a>

### `codex logout`
采集：`codex logout --help`；退出码：`0`。

````text
Remove stored authentication credentials

Usage: codex logout [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-6"></a>

### `codex mcp`
采集：`codex mcp --help`；退出码：`0`。

````text
Manage external MCP servers for Codex

Usage: codex mcp [OPTIONS] <COMMAND>

Commands:
  list
  get
  add
  remove
  login
  logout
  help    Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-7"></a>

### `codex plugin`
采集：`codex plugin --help`；退出码：`0`。

````text
Manage Codex plugins

Usage: codex plugin [OPTIONS] <COMMAND>

Commands:
  add          Install a plugin from a configured or remote marketplace
  list         List plugins available from configured and remote marketplaces
  marketplace  Add, list, upgrade, or remove configured plugin marketplaces
  remove       Uninstall a plugin and remove its local cache
  help         Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-8"></a>

### `codex app-server`
采集：`codex app-server --help`；退出码：`0`。

````text
[experimental] Run the app server or related tooling

Usage: codex app-server [OPTIONS] [COMMAND]

Commands:
  daemon                Manage the local app-server daemon
  proxy                 Proxy stdio bytes to the running app-server control socket
  generate-ts           [experimental] Generate TypeScript bindings for the app server protocol
  generate-json-schema  [experimental] Generate JSON Schema for the app server protocol
  help                  Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --code-mode-host <URL>
          Connect to a remote code-mode host instead of starting a local host

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

      --listen <URL>
          Transport endpoint URL. Supported values: `stdio://` (default), `unix://`, `unix://PATH`,
          `ws://IP:PORT`, `off`

          [default: stdio://]

      --stdio
          Use stdio as the transport (equivalent to `--listen stdio://`)

      --analytics-default-enabled
          Controls whether analytics are enabled by default.

          Analytics are disabled by default for app-server. Users have to explicitly opt in via the
          `analytics` section in the config.toml file.

          However, for first-party use cases like the VSCode IDE extension, we default analytics to
          be enabled by default by setting this flag. Users can still opt out by setting this in
          their config.toml:

          ```toml [analytics] enabled = false ```

          See https://developers.openai.com/codex/config-advanced/#metrics for more details.

      --ws-auth <MODE>
          Websocket auth mode for non-loopback listeners

          [possible values: capability-token, signed-bearer-token]

      --ws-token-file <PATH>
          Absolute path to the capability-token file

      --ws-token-sha256 <HEX>
          Hex-encoded SHA-256 digest of the capability token

      --ws-shared-secret-file <PATH>
          Absolute path to the shared secret file for signed JWT bearer tokens

      --ws-issuer <ISSUER>
          Expected issuer for signed JWT bearer tokens

      --ws-audience <AUDIENCE>
          Expected audience for signed JWT bearer tokens

      --ws-max-clock-skew-seconds <SECONDS>
          Maximum clock skew when validating signed JWT bearer tokens

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-9"></a>

### `codex remote-control`
采集：`codex remote-control --help`；退出码：`0`。

````text
[experimental] Manage the app-server daemon with remote control enabled

Usage: codex remote-control [OPTIONS] [COMMAND]

Commands:
  start  Start the app-server daemon with remote control enabled
  stop   Stop the app-server daemon
  pair   Create and print a short-lived manual pairing code
  help   Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Emit machine-readable JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-10"></a>

### `codex app`
采集：`codex app --help`；退出码：`0`。

````text
Launch the Desktop app (opens the app installer if missing)

Usage: codex app [OPTIONS] [PATH]

Arguments:
  [PATH]
          Workspace path to open in the Desktop app

          [default: .]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --download-url <DOWNLOAD_URL_OVERRIDE>
          Override the app installer download URL (advanced)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-11"></a>

### `codex completion`
采集：`codex completion --help`；退出码：`0`。

````text
Generate shell completion scripts

Usage: codex completion [OPTIONS] [SHELL]

Arguments:
  [SHELL]
          Shell to generate completions for

          [default: bash]
          [possible values: bash, elvish, fish, powershell, zsh]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-12"></a>

### `codex update`
采集：`codex update --help`；退出码：`0`。

````text
Update Codex to the latest version

Usage: codex update [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-13"></a>

### `codex doctor`
采集：`codex doctor --help`；退出码：`0`。

````text
Diagnose local Codex installation, config, auth, and runtime health

Usage: codex doctor [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Emit a redacted machine-readable report

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --summary
          Only show grouped check rows and the final count summary

      --all
          Expand long lists in detailed human output

      --no-color
          Disable ANSI color in human output

      --ascii
          Use ASCII status labels and separators in human output

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-14"></a>

### `codex sandbox`
采集：`codex sandbox --help`；退出码：`0`。

````text
Run commands within a Codex-provided sandbox

Usage: codex sandbox [OPTIONS] [COMMAND]...

Arguments:
  [COMMAND]...
          Full command args to run under seatbelt

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --sandbox-state-json <JSON>
          JSON value from `codex/sandbox-state-meta` to apply directly

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --sandbox-state-readable-root <SANDBOX_STATE_READABLE_ROOT>
          Add a readable root to the supplied sandbox state. Repeat for multiple roots

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --sandbox-state-disable-network
          Disable direct network access in the supplied sandbox state

  -P, --permission-profile <NAME>
          Named permissions profile to apply from the active configuration stack

  -p, --profile <CONFIG_PROFILE>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -C, --cd <DIR>
          Working directory used for profile resolution and command execution

      --include-managed-config
          Include managed requirements while resolving an explicit permissions profile

      --allow-unix-socket <ALLOW_UNIX_SOCKETS>
          Allow the sandboxed command to bind/connect AF_UNIX sockets rooted at this path. Relative
          paths are resolved against the current directory. Repeat to allow multiple paths

      --log-denials
          While the command runs, capture macOS sandbox denials via `log stream` and print them
          after exit

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-15"></a>

### `codex debug`
采集：`codex debug --help`；退出码：`0`。

````text
Debugging tools

Usage: codex debug [OPTIONS] <COMMAND>

Commands:
  models        Render the raw model catalog as JSON
  app-server    Tooling: helps debug the app server
  prompt-input  Render the model-visible prompt input list as JSON
  help          Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-16"></a>

### `codex apply`
采集：`codex apply --help`；退出码：`0`。

````text
Apply the latest diff produced by Codex agent as a `git apply` to your local working tree

Usage: codex apply [OPTIONS] <TASK_ID>

Arguments:
  <TASK_ID>


Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-17"></a>

### `codex resume`
采集：`codex resume --help`；退出码：`0`。

````text
Resume a previous interactive session (picker by default; use --last to continue the most recent)

Usage: codex resume [OPTIONS] [SESSION_ID] [PROMPT]

Arguments:
  [SESSION_ID]
          Session id (UUID) or session name. UUIDs take precedence if it parses. If omitted, use
          --last to pick the most recent recorded session

  [PROMPT]
          Optional user prompt to start the session

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --last
          Continue the most recent session without showing the picker

      --all
          Show all sessions (disables cwd filtering and shows CWD column)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --include-non-interactive
          Include non-interactive sessions in the resume picker and --last selection

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

  -a, --ask-for-approval <APPROVAL_POLICY>
          Configure when the model requires human approval before executing a command

          Possible values:
          - on-request: The model decides when to ask the user for approval
          - never:      Never ask for user approval Execution failures are immediately returned to
            the model

      --search
          Enable live web search. When enabled, the native Responses `web_search` tool is available
          to the model (no per‑call approval)

      --no-alt-screen
          Disable alternate screen mode

          Runs the TUI in inline mode, preserving terminal scrollback history.

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
````

<a id="cmd-18"></a>

### `codex queue`
采集：`codex queue --help`；退出码：`0`。

````text
Queue a message for an existing session

Usage: codex queue [OPTIONS] --thread <THREAD> --message <TEXT>

Options:
      --thread <THREAD>
          Session UUID or exact session name

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --message <TEXT>
          Message text to queue

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-19"></a>

### `codex archive`
采集：`codex archive --help`；退出码：`0`。

````text
Archive a saved session by id or session name

Usage: codex archive [OPTIONS] <SESSION>

Arguments:
  <SESSION>
          Session id (UUID) or session name. UUIDs take precedence if it parses

Options:
      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-20"></a>

### `codex delete`
采集：`codex delete --help`；退出码：`0`。

````text
Permanently delete a saved session by id or session name

Usage: codex delete [OPTIONS] <SESSION>

Arguments:
  <SESSION>
          Session id (UUID) or session name. UUIDs take precedence if it parses

Options:
      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --force
          Delete without prompting. SESSION must be a UUID

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-21"></a>

### `codex migrate-rollouts`
采集：`codex migrate-rollouts --help`；退出码：`0`。

````text
Inspect or migrate legacy local sessions to paginated thread history

Usage: codex migrate-rollouts [OPTIONS]

Options:
      --apply
          Publish the migration. Without this flag the command only reports eligible sessions

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --thread <THREAD_ID>
          Restrict inspection or migration to one or more thread IDs

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --max-mib-per-second <MIB>
          Limit aggregate rollout read and write throughput, in MiB per second

      --json
          Emit the complete per-thread report as JSON

      --verbose
          Print one line for every inspected rollout

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-22"></a>

### `codex unarchive`
采集：`codex unarchive --help`；退出码：`0`。

````text
Unarchive a saved session by id or session name

Usage: codex unarchive [OPTIONS] <SESSION>

Arguments:
  <SESSION>
          Session id (UUID) or session name. UUIDs take precedence if it parses

Options:
      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-23"></a>

### `codex fork`
采集：`codex fork --help`；退出码：`0`。

````text
Fork a previous interactive session (picker by default; use --last to fork the most recent)

Usage: codex fork [OPTIONS] [SESSION_ID] [PROMPT]

Arguments:
  [SESSION_ID]
          Conversation/session id (UUID). When provided, forks this session. If omitted, use --last
          to pick the most recent recorded session

  [PROMPT]
          Optional user prompt to start the session

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --last
          Fork the most recent session without showing the picker

      --all
          Show all sessions (disables cwd filtering and shows CWD column)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`.

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --worktree
          Run the session in a new managed Git worktree

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

  -a, --ask-for-approval <APPROVAL_POLICY>
          Configure when the model requires human approval before executing a command

          Possible values:
          - on-request: The model decides when to ask the user for approval
          - never:      Never ask for user approval Execution failures are immediately returned to
            the model

      --search
          Enable live web search. When enabled, the native Responses `web_search` tool is available
          to the model (no per‑call approval)

      --no-alt-screen
          Disable alternate screen mode

          Runs the TUI in inline mode, preserving terminal scrollback history.

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
````

<a id="cmd-24"></a>

### `codex cloud`
采集：`codex cloud --help`；退出码：`0`。

````text
[EXPERIMENTAL] Browse tasks from Codex Cloud and apply changes locally

Usage: codex cloud [OPTIONS] [COMMAND]

Commands:
  exec    Submit a new Codex Cloud task without launching the TUI
  status  Show the status of a Codex Cloud task
  list    List Codex Cloud tasks
  apply   Apply the diff for a Codex Cloud task locally
  diff    Show the unified diff for a Codex Cloud task
  help    Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
````

<a id="cmd-25"></a>

### `codex exec-server`
采集：`codex exec-server --help`；退出码：`0`。

````text
[EXPERIMENTAL] Run the standalone exec-server service

Usage: codex exec-server [OPTIONS] [COMMAND]

Commands:
  forward  Register an existing WebSocket exec-server as a remote environment
  help     Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

      --concurrent-requests <COUNT>
          Maximum number of requests to process concurrently on each connection

          [default: 1]

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --listen <URL>
          Transport endpoint URL. Supported values: `ws://IP:PORT` (default), `stdio`, `stdio://`

      --remote <URL>
          Register this exec-server as a remote environment using the given base URL

      --remote-transport <REMOTE_TRANSPORT>
          Transport used for the remote executor connection

          [default: noise]
          [possible values: noise, direct]

      --environment-id <ID>
          Environment id to attach to when registering remotely

      --name <NAME>
          Human-readable environment name

      --use-agent-identity-auth
          Use Agent Identity auth from CODEX_ACCESS_TOKEN for remote registration

      --aws-sigv4
          Sign Direct registration and WebSocket handshake requests with AWS SigV4

      --aws-profile <PROFILE>
          AWS profile used for SigV4 authentication

      --aws-region <REGION>
          AWS signing region. Uses the SDK region chain when omitted

      --aws-service <SERVICE>
          AWS signing service

          [default: execute-api]

      --exit-on-stdin-close
          Exit when the parent-owned standard-input pipe closes

          [env: CODEX_EXEC_SERVER_EXIT_ON_STDIN_CLOSE=]

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-26"></a>

### `codex features`
采集：`codex features --help`；退出码：`0`。

````text
Inspect feature flags

Usage: codex features [OPTIONS] <COMMAND>

Commands:
  list     List known features with their stage and effective state
  enable   Enable a feature in config.toml
  disable  Disable a feature in config.toml
  help     Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-27"></a>

### `codex exec resume`
采集：`codex exec resume --help`；退出码：`0`。

````text
Resume a previous session by id or pick the most recent with --last

Usage: codex exec resume [OPTIONS] [SESSION_ID] [PROMPT]

Arguments:
  [SESSION_ID]
          Conversation/session id (UUID) or thread name. UUIDs take precedence if it parses. If
          omitted, use --last to pick the most recent recorded session

  [PROMPT]
          Prompt to send after resuming the session. If `-` is used, read from stdin

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --last
          Resume the most recent recorded session (newest) without specifying an id

      --all
          Show all sessions (disables cwd filtering)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -i, --image <FILE>
          Optional image(s) to attach to the prompt sent after resuming

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -m, --model <MODEL>
          Model the agent should use

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

      --worktree
          Run the session in a new managed Git worktree

      --thread-source <SOURCE>
          Source classification for newly created or forked threads

      --skip-git-repo-check
          Allow running Codex outside a Git repository

      --ephemeral
          Run without persisting session files to disk

      --ignore-user-config
          Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`

      --ignore-rules
          Do not load user or project execpolicy `.rules` files

      --output-schema <FILE>
          Path to a JSON Schema file describing the model's final response shape

      --json
          Print events to stdout as JSONL

  -o, --output-last-message <FILE>
          Specifies file where the last message from the agent should be written

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-28"></a>

### `codex exec fork`
采集：`codex exec fork --help`；退出码：`0`。

````text
Fork a previous session by id into a new session

Usage: codex exec fork [OPTIONS] <SESSION_ID> [PROMPT]

Arguments:
  <SESSION_ID>
          Conversation/session id (UUID) or thread name to fork

  [PROMPT]
          Optional prompt to send after forking. If `-` is used, read from stdin

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -i, --image <FILE>
          Optional image(s) to attach to the prompt sent after forking

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -m, --model <MODEL>
          Model the agent should use

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

      --worktree
          Run the session in a new managed Git worktree

      --thread-source <SOURCE>
          Source classification for newly created or forked threads

      --skip-git-repo-check
          Allow running Codex outside a Git repository

      --ephemeral
          Run without persisting session files to disk

      --ignore-user-config
          Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`

      --ignore-rules
          Do not load user or project execpolicy `.rules` files

      --output-schema <FILE>
          Path to a JSON Schema file describing the model's final response shape

      --json
          Print events to stdout as JSONL

  -o, --output-last-message <FILE>
          Specifies file where the last message from the agent should be written

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-29"></a>

### `codex exec review`
采集：`codex exec review --help`；退出码：`0`。

````text
Run a code review against the current repository

Usage: codex exec review [OPTIONS] [PROMPT]

Arguments:
  [PROMPT]
          Custom review instructions. If `-` is used, read from stdin

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --uncommitted
          Review staged, unstaged, and untracked changes

      --base <BRANCH>
          Review changes against the given base branch

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --commit <SHA>
          Review the changes introduced by a commit

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

      --title <TITLE>
          Optional commit title to display in the review summary

  -m, --model <MODEL>
          Model the agent should use

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

      --worktree
          Run the session in a new managed Git worktree

      --thread-source <SOURCE>
          Source classification for newly created or forked threads

      --skip-git-repo-check
          Allow running Codex outside a Git repository

      --ephemeral
          Run without persisting session files to disk

      --ignore-user-config
          Do not load `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME`

      --ignore-rules
          Do not load user or project execpolicy `.rules` files

      --output-schema <FILE>
          Path to a JSON Schema file describing the model's final response shape

      --json
          Print events to stdout as JSONL

  -o, --output-last-message <FILE>
          Specifies file where the last message from the agent should be written

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-30"></a>

### `codex login status`
采集：`codex login status --help`；退出码：`0`。

````text
Show login status

Usage: codex login status [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-31"></a>

### `codex mcp list`
采集：`codex mcp list --help`；退出码：`0`。

````text
Usage: codex mcp list [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Output the configured servers as JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-32"></a>

### `codex mcp get`
采集：`codex mcp get --help`；退出码：`0`。

````text
Usage: codex mcp get [OPTIONS] <NAME>

Arguments:
  <NAME>
          Name of the MCP server to display

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Output the server configuration as JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-33"></a>

### `codex mcp add`
采集：`codex mcp add --help`；退出码：`0`。

````text
Usage: codex mcp add [OPTIONS] <NAME> (--url <URL> | -- <COMMAND>...)

Arguments:
  <NAME>
          Name for the MCP server configuration

  [COMMAND]...
          Command to launch the MCP server. Use --url for a streamable HTTP server

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --env <KEY=VALUE>
          Environment variables to set when launching the server. Only valid with stdio servers

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --url <URL>
          URL for a streamable HTTP MCP server

      --bearer-token-env-var <ENV_VAR>
          Optional environment variable to read for a bearer token. Only valid with streamable HTTP
          servers

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --oauth-client-id <CLIENT_ID>
          Optional OAuth client identifier to use for this MCP server

      --oauth-client-registration <AUTO|CIMD|DCR>
          OAuth client-registration strategy for the immediate login only

          [possible values: auto, cimd, dcr]

      --oauth-resource <RESOURCE>
          Optional OAuth resource parameter to include during MCP login

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-34"></a>

### `codex mcp remove`
采集：`codex mcp remove --help`；退出码：`0`。

````text
Usage: codex mcp remove [OPTIONS] <NAME>

Arguments:
  <NAME>
          Name of the MCP server configuration to remove

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-35"></a>

### `codex mcp login`
采集：`codex mcp login --help`；退出码：`0`。

````text
Usage: codex mcp login [OPTIONS] <NAME>

Arguments:
  <NAME>
          Name of the MCP server to authenticate with oauth

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --scopes <SCOPE,SCOPE>
          Comma-separated list of OAuth scopes to request

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --oauth-client-registration <AUTO|CIMD|DCR>
          OAuth client-registration strategy for this login only

          [possible values: auto, cimd, dcr]

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-36"></a>

### `codex mcp logout`
采集：`codex mcp logout --help`；退出码：`0`。

````text
Usage: codex mcp logout [OPTIONS] <NAME>

Arguments:
  <NAME>
          Name of the MCP server to deauthenticate

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-37"></a>

### `codex plugin add`
采集：`codex plugin add --help`；退出码：`0`。

````text
Install a plugin from a configured or remote marketplace.

Pass either `PLUGIN@MARKETPLACE` or pass `PLUGIN` with `--marketplace MARKETPLACE`.

Usage: codex plugin add [OPTIONS] <PLUGIN[@MARKETPLACE]>

Arguments:
  <PLUGIN[@MARKETPLACE]>
          Plugin selector to install: either PLUGIN@MARKETPLACE or PLUGIN with --marketplace

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -m, --marketplace <MARKETPLACE>
          Marketplace name to use when PLUGIN does not include @MARKETPLACE

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --json
          Output install result as JSON

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

Examples:
  codex plugin add sample@debug
  codex plugin add sample --marketplace debug
````

<a id="cmd-38"></a>

### `codex plugin list`
采集：`codex plugin list --help`；退出码：`0`。

````text
List plugins available from configured and remote marketplaces

Usage: codex plugin list [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -m, --marketplace <MARKETPLACE>
          Only list plugins from this marketplace name

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --json
          Output plugin list as JSON

      --available
          Include uninstalled marketplace plugins in the JSON output

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

Examples:
  codex plugin list
  codex plugin list --marketplace debug
  codex plugin list --json
  codex plugin list --available --json
````

<a id="cmd-39"></a>

### `codex plugin marketplace`
采集：`codex plugin marketplace --help`；退出码：`0`。

````text
Add, list, upgrade, or remove configured plugin marketplaces

Usage: codex plugin marketplace [OPTIONS] <COMMAND>

Commands:
  add      Add a local or Git marketplace to the configured marketplace sources
  list     List plugin marketplaces Codex is currently considering and their roots
  upgrade  Refresh configured Git marketplace snapshots
  remove   Remove a configured marketplace source by name
  help     Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-40"></a>

### `codex plugin remove`
采集：`codex plugin remove --help`；退出码：`0`。

````text
Uninstall a plugin and remove its local cache.

Pass either `PLUGIN@MARKETPLACE` or pass `PLUGIN` with `--marketplace MARKETPLACE`.

Usage: codex plugin remove [OPTIONS] <PLUGIN[@MARKETPLACE]>

Arguments:
  <PLUGIN[@MARKETPLACE]>
          Plugin selector to remove: either PLUGIN@MARKETPLACE or PLUGIN with --marketplace

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -m, --marketplace <MARKETPLACE>
          Marketplace name to use when PLUGIN does not include @MARKETPLACE

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --json
          Output remove result as JSON

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

Examples:
  codex plugin remove sample@debug
  codex plugin remove sample --marketplace debug
````

<a id="cmd-41"></a>

### `codex app-server daemon`
采集：`codex app-server daemon --help`；退出码：`0`。

````text
Manage the local app-server daemon

Usage: codex app-server daemon [OPTIONS] <COMMAND>

Commands:
  bootstrap               Install durable local app-server management for SSH-driven use
  start                   Start the local app server daemon if it is not already running
  restart                 Restart the local app server daemon
  enable-remote-control   Enable remote control for future starts and a currently running managed
                          daemon
  disable-remote-control  Disable remote control for future starts and a currently running managed
                          daemon
  stop                    Stop the local app server daemon
  version                 Print local CLI and running app-server versions as JSON
  help                    Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-42"></a>

### `codex app-server proxy`
采集：`codex app-server proxy --help`；退出码：`0`。

````text
Proxy stdio bytes to the running app-server control socket

Usage: codex app-server proxy [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --sock <SOCKET_PATH>
          Path to the app-server Unix domain socket to connect to

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-43"></a>

### `codex app-server generate-ts`
采集：`codex app-server generate-ts --help`；退出码：`0`。

````text
[experimental] Generate TypeScript bindings for the app server protocol

Usage: codex app-server generate-ts [OPTIONS] --out <DIR>

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -o, --out <DIR>
          Output directory where .ts files will be written

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

  -p, --prettier <PRETTIER_BIN>
          Optional path to the Prettier executable to format generated files

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --experimental
          Include experimental methods and fields in the generated output

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-44"></a>

### `codex app-server generate-json-schema`
采集：`codex app-server generate-json-schema --help`；退出码：`0`。

````text
[experimental] Generate JSON Schema for the app server protocol

Usage: codex app-server generate-json-schema [OPTIONS] --out <DIR>

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -o, --out <DIR>
          Output directory where the schema bundle will be written

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --experimental
          Include experimental methods and fields in the generated output

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-45"></a>

### `codex remote-control start`
采集：`codex remote-control start --help`；退出码：`0`。

````text
Start the app-server daemon with remote control enabled

Usage: codex remote-control start [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Emit machine-readable JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-46"></a>

### `codex remote-control stop`
采集：`codex remote-control stop --help`；退出码：`0`。

````text
Stop the app-server daemon

Usage: codex remote-control stop [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Emit machine-readable JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-47"></a>

### `codex remote-control pair`
采集：`codex remote-control pair --help`；退出码：`0`。

````text
Create and print a short-lived manual pairing code

Usage: codex remote-control pair [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Emit machine-readable JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-48"></a>

### `codex debug models`
采集：`codex debug models --help`；退出码：`0`。

````text
Render the raw model catalog as JSON

Usage: codex debug models [OPTIONS]

Options:
      --bundled
          Skip refresh and dump only the bundled catalog shipped with this binary

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-49"></a>

### `codex debug app-server`
采集：`codex debug app-server --help`；退出码：`0`。

````text
Tooling: helps debug the app server

Usage: codex debug app-server [OPTIONS] <COMMAND>

Commands:
  send-message-v2
  help             Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-50"></a>

### `codex debug prompt-input`
采集：`codex debug prompt-input --help`；退出码：`0`。

````text
Render the model-visible prompt input list as JSON

Usage: codex debug prompt-input [OPTIONS] [PROMPT]

Arguments:
  [PROMPT]
          Optional user prompt to append after session context

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -i, --image <FILE>...
          Optional image(s) to attach to the user prompt

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-51"></a>

### `codex cloud exec`
采集：`codex cloud exec --help`；退出码：`0`。

````text
Submit a new Codex Cloud task without launching the TUI

Usage: codex cloud exec [OPTIONS] --env <ENV_ID> [QUERY]

Arguments:
  [QUERY]
          Task prompt to run in Codex Cloud

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --env <ENV_ID>
          Target environment identifier (see `codex cloud` to browse)

      --attempts <ATTEMPTS>
          Number of assistant attempts (best-of-N)

          [default: 1]

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --branch <BRANCH>
          Git branch to run in Codex Cloud (defaults to current branch)

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-52"></a>

### `codex cloud status`
采集：`codex cloud status --help`；退出码：`0`。

````text
Show the status of a Codex Cloud task

Usage: codex cloud status [OPTIONS] <TASK_ID>

Arguments:
  <TASK_ID>
          Codex Cloud task identifier to inspect

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-53"></a>

### `codex cloud list`
采集：`codex cloud list --help`；退出码：`0`。

````text
List Codex Cloud tasks

Usage: codex cloud list [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --env <ENV_ID>
          Filter tasks by environment identifier

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --limit <N>
          Maximum number of tasks to return (1-20)

          [default: 20]

      --cursor <CURSOR>
          Pagination cursor returned by a previous call

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --json
          Emit JSON instead of plain text

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-54"></a>

### `codex cloud apply`
采集：`codex cloud apply --help`；退出码：`0`。

````text
Apply the diff for a Codex Cloud task locally

Usage: codex cloud apply [OPTIONS] <TASK_ID>

Arguments:
  <TASK_ID>
          Codex Cloud task identifier to apply

Options:
      --attempt <N>
          Attempt number to apply (1-based)

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-55"></a>

### `codex cloud diff`
采集：`codex cloud diff --help`；退出码：`0`。

````text
Show the unified diff for a Codex Cloud task

Usage: codex cloud diff [OPTIONS] <TASK_ID>

Arguments:
  <TASK_ID>
          Codex Cloud task identifier to display

Options:
      --attempt <N>
          Attempt number to display (1-based)

  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-56"></a>

### `codex exec-server forward`
采集：`codex exec-server forward --help`；退出码：`0`。

````text
Register an existing WebSocket exec-server as a remote environment

Usage: codex exec-server forward [OPTIONS] --remote <URL> --environment-id <ID> --connect <URL>

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --connect <URL>
          Destination exec-server WebSocket URL

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --remote <URL>
          Register this exec-server as a remote environment using the given base URL

      --remote-transport <REMOTE_TRANSPORT>
          Transport used for the remote executor connection

          [default: noise]
          [possible values: noise, direct]

      --environment-id <ID>
          Environment id to attach to when registering remotely

      --name <NAME>
          Human-readable environment name

      --use-agent-identity-auth
          Use Agent Identity auth from CODEX_ACCESS_TOKEN for remote registration

      --aws-sigv4
          Sign Direct registration and WebSocket handshake requests with AWS SigV4

      --aws-profile <PROFILE>
          AWS profile used for SigV4 authentication

      --aws-region <REGION>
          AWS signing region. Uses the SDK region chain when omitted

      --aws-service <SERVICE>
          AWS signing service

          [default: execute-api]

      --exit-on-stdin-close
          Exit when the parent-owned standard-input pipe closes

          [env: CODEX_EXEC_SERVER_EXIT_ON_STDIN_CLOSE=]

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-57"></a>

### `codex features list`
采集：`codex features list --help`；退出码：`0`。

````text
List known features with their stage and effective state

Usage: codex features list [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-58"></a>

### `codex features enable`
采集：`codex features enable --help`；退出码：`0`。

````text
Enable a feature in config.toml

Usage: codex features enable [OPTIONS] <FEATURE>

Arguments:
  <FEATURE>
          Feature key to update (for example: unified_exec)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-59"></a>

### `codex features disable`
采集：`codex features disable --help`；退出码：`0`。

````text
Disable a feature in config.toml

Usage: codex features disable [OPTIONS] <FEATURE>

Arguments:
  <FEATURE>
          Feature key to update (for example: unified_exec)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-60"></a>

### `codex plugin marketplace add`
采集：`codex plugin marketplace add --help`；退出码：`0`。

````text
Add a local or Git marketplace to the configured marketplace sources

Usage: codex plugin marketplace add [OPTIONS] <SOURCE>

Arguments:
  <SOURCE>
          Marketplace source: a local path, owner/repo[@ref], HTTPS Git URL, or SSH Git URL

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --ref <REF>
          Git ref to fetch for Git marketplace sources

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --sparse <PATH>
          Sparse checkout path for Git marketplace sources. Can be repeated

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --json
          Output add result as JSON

  -h, --help
          Print help (see a summary with '-h')

Examples:
  codex plugin marketplace add ./path/to/marketplace
  codex plugin marketplace add owner/repo --ref main
  codex plugin marketplace add https://github.com/owner/repo --sparse plugins/foo
````

<a id="cmd-61"></a>

### `codex plugin marketplace list`
采集：`codex plugin marketplace list --help`；退出码：`0`。

````text
List plugin marketplaces Codex is currently considering and their roots

Usage: codex plugin marketplace list [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Output marketplace list as JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-62"></a>

### `codex plugin marketplace upgrade`
采集：`codex plugin marketplace upgrade --help`；退出码：`0`。

````text
Refresh configured Git marketplace snapshots.

Omit MARKETPLACE_NAME to upgrade all configured Git marketplaces.

Usage: codex plugin marketplace upgrade [OPTIONS] [MARKETPLACE_NAME]

Arguments:
  [MARKETPLACE_NAME]
          Optional configured marketplace name to upgrade. Omit to upgrade all Git marketplaces

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Output upgrade result as JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

Examples:
  codex plugin marketplace upgrade
  codex plugin marketplace upgrade debug
````

<a id="cmd-63"></a>

### `codex plugin marketplace remove`
采集：`codex plugin marketplace remove --help`；退出码：`0`。

````text
Remove a configured marketplace source by name

Usage: codex plugin marketplace remove [OPTIONS] <MARKETPLACE_NAME>

Arguments:
  <MARKETPLACE_NAME>
          Configured marketplace name to remove

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --json
          Output remove result as JSON

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')

Example:
  codex plugin marketplace remove debug
````

<a id="cmd-64"></a>

### `codex app-server daemon bootstrap`
采集：`codex app-server daemon bootstrap --help`；退出码：`0`。

````text
Install durable local app-server management for SSH-driven use

Usage: codex app-server daemon bootstrap [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --remote-control
          Launch the managed app-server with remote control enabled

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-65"></a>

### `codex app-server daemon start`
采集：`codex app-server daemon start --help`；退出码：`0`。

````text
Start the local app server daemon if it is not already running

Usage: codex app-server daemon start [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-66"></a>

### `codex app-server daemon restart`
采集：`codex app-server daemon restart --help`；退出码：`0`。

````text
Restart the local app server daemon

Usage: codex app-server daemon restart [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-67"></a>

### `codex app-server daemon enable-remote-control`
采集：`codex app-server daemon enable-remote-control --help`；退出码：`0`。

````text
Enable remote control for future starts and a currently running managed daemon

Usage: codex app-server daemon enable-remote-control [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-68"></a>

### `codex app-server daemon disable-remote-control`
采集：`codex app-server daemon disable-remote-control --help`；退出码：`0`。

````text
Disable remote control for future starts and a currently running managed daemon

Usage: codex app-server daemon disable-remote-control [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-69"></a>

### `codex app-server daemon stop`
采集：`codex app-server daemon stop --help`；退出码：`0`。

````text
Stop the local app server daemon

Usage: codex app-server daemon stop [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-70"></a>

### `codex app-server daemon version`
采集：`codex app-server daemon version --help`；退出码：`0`。

````text
Print local CLI and running app-server versions as JSON

Usage: codex app-server daemon version [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-71"></a>

### `codex debug app-server send-message-v2`
采集：`codex debug app-server send-message-v2 --help`；退出码：`0`。

````text
Usage: codex debug app-server send-message-v2 [OPTIONS] <USER_MESSAGE>

Arguments:
  <USER_MESSAGE>


Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-72"></a>

### `codex execpolicy`
采集：`codex execpolicy --help`；退出码：`0`。

````text
Execpolicy tooling

Usage: codex execpolicy [OPTIONS] <COMMAND>

Commands:
  check  Check execpolicy files against a command
  help   Print this message or the help of the given subcommand(s)

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-73"></a>

### `codex execpolicy check`
采集：`codex execpolicy check --help`；退出码：`0`。

````text
Check execpolicy files against a command

Usage: codex execpolicy check [OPTIONS] --rules <PATH> <COMMAND>...

Arguments:
  <COMMAND>...
          Command tokens to check against the policy

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -r, --rules <PATH>
          Paths to execpolicy rule files to evaluate (repeatable)

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --pretty
          Pretty-print the JSON output

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --resolve-host-executables
          Resolve absolute program paths against basename rules, gated by any `host_executable()`
          definitions in the loaded policy files

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-74"></a>

### `codex responses-api-proxy`
采集：`codex responses-api-proxy --help`；退出码：`0`。

````text
Internal: run the responses API proxy

Usage: codex responses-api-proxy [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --port <PORT>
          Port to listen on. If not set, an ephemeral port is used

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --server-info <FILE>
          Path to a JSON file to write startup info (single line). Includes {"port": <u16>}

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --http-shutdown
          Enable HTTP shutdown endpoint at GET /shutdown

      --upstream-url <UPSTREAM_URL>
          Absolute URL the proxy should forward requests to (defaults to OpenAI)

          [default: https://api.openai.com/v1/responses]

      --dump-dir <DIR>
          Directory where request/response dumps should be written as JSON

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-75"></a>

### `codex stdio-to-uds`
采集：`codex stdio-to-uds --help`；退出码：`0`。

````text
Internal: relay stdio to a Unix domain socket

Usage: codex stdio-to-uds [OPTIONS] <SOCKET_PATH>

Arguments:
  <SOCKET_PATH>
          Path to the Unix domain socket to connect to

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-76"></a>

### `codex debug trace-reduce`
采集：`codex debug trace-reduce --help`；退出码：`0`。

````text
Replay a rollout trace bundle and write reduced state JSON

Usage: codex debug trace-reduce [OPTIONS] <TRACE_BUNDLE>

Arguments:
  <TRACE_BUNDLE>
          Trace bundle directory containing manifest.json and trace.jsonl

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -o, --output <FILE>
          Output path for reduced RolloutTrace JSON. Defaults to TRACE_BUNDLE/state.json

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-77"></a>

### `codex debug clear-memories`
采集：`codex debug clear-memories --help`；退出码：`0`。

````text
Internal: reset local memory state for a fresh start

Usage: codex debug clear-memories [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-78"></a>

### `codex app-server generate-internal-json-schema`
采集：`codex app-server generate-internal-json-schema --help`；退出码：`0`。

````text
[internal] Generate internal JSON Schema artifacts for Codex tooling

Usage: codex app-server generate-internal-json-schema [OPTIONS] --out <DIR>

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

  -o, --out <DIR>
          Output directory where internal JSON Schema artifacts will be written

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

<a id="cmd-79"></a>

### `codex app-server daemon pid-update-loop`
采集：`codex app-server daemon pid-update-loop --help`；退出码：`0`。

````text
[internal] Run the detached pid-backed standalone updater loop

Usage: codex app-server daemon pid-update-loop [OPTIONS]

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`.
          Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c
          shell_environment_policy.inherit=all`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

  -h, --help
          Print help (see a summary with '-h')
````

## 隐藏、兼容与平台入口

原始快照中的 `execpolicy`、`execpolicy check`、`responses-api-proxy`、`stdio-to-uds`、`debug trace-reduce`、`debug clear-memories`、`app-server generate-internal-json-schema`、`app-server daemon pid-update-loop` 不出现在对应父级公开命令列表中，但本机可以读取各自帮助，故已补全收录。仅查询 `--help`，未执行它们的操作。

本机 `codex sandbox` 直接接收待执行命令，没有 `macos`、`linux`、`windows` 子命令列表。不要把其他版本/平台的示例当成本机参数。另测 `codex mcp-server --help` 返回的是根帮助，不能据此确认独立 `mcp-server` 子命令存在，故不将其作为已验证的子命令收录。

未在帮助中公开的单项参数还有内部/兼容选项。下面几项只在另存源码中找到，**不算 0.154.0 二进制已验证参数**：

| 位置 | 源码声明 | 限制 |
| --- | --- | --- |
| `login` | `--api-key [API_KEY]` | 已废弃，只返回使用 stdin 的指引 |
| `login` | `--experimental_issuer <URL>` | 实验 OAuth issuer |
| `login` | `--experimental_client-id <CLIENT_ID>` | 实验 OAuth client ID |
| `app-server` | `--remote-control` | 隐藏参数；不是顶层 remote-control 管理命令 |

公开参数及本机能够读取的隐藏命令帮助已经完整记录；不能声称通过另一个提交的源码穷尽已安装二进制所有私有参数。

## Goal 与源码证据

官方交互命令：`/goal <objective>`、`/goal`、`/goal edit`、`/goal pause`、`/goal resume`、`/goal clear`；目标文本上限 4,000 字符。这些是 TUI 会话命令，当前 `codex exec --help` 没有 `--goal`。不要推断 `exec` 会把以 `/goal` 开头的普通 prompt 自动解释为同样的命令。[官方 Developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)

本地源码补证来自 `~/Code/best-harness/repos/codex`，提交 **`c4941302c73c6322b153bba13ac0a9f4396301d6`**；采集时该工作树干净，`git describe` 为 `codex-zsh-v0.1.0-1475-gc4941302c7`。这不是安装包版本标识，不能证明与 `codex-cli 0.154.0` 完全一致。

- `codex-rs/app-server/README.md` 的 goal 示例描述 `thread/goal/set`、`thread/goal/get`、`thread/goal/clear` 以及更新/清除通知。
- `thread/goal/set` 示例参数含 `threadId`、`objective`、`tokenBudget`；若 `goals.max_goal_token_budget` 配置了上限，新目标预算受其约束。
- `codex-rs/tui/src/slash_command.rs` 注册 `Goal` 和其他会话命令；不代表 exec 启动参数。
- 上述源码用于原生参考补证。现行 harness-swarm 已有 [App Server Goal 执行器](../../src/codex-goal.ts)，通过 thread/goal/set 等协议执行 Goal；普通 exec 与专用 Goal 协议的边界见 [README.md](README.md)。

配置覆盖的通用格式为 `-c key=value`，值按 TOML 解析。例如推理强度通常由 `model_reasoning_effort` 配置键控制；它不是 `--effort`，支持值取决于模型与版本。配置键完整定义应查对应版本 schema 或[官方配置参考](https://developers.openai.com/codex/config-reference/)，不与本页 CLI flag 清单混为一谈。

## 会话内 slash 命令补充索引

下表来自上述固定源码提交的 `SlashCommand` 枚举；**用于解释命令面，不作为安装二进制运行时完整菜单**。平台、模型、功能开关会控制可见性。插件/技能动态入口也不在此静态枚举中。标记“接受”表示源码 `supports_inline_args` 为真，不代表任意字符串都合法。

| 命令 | 行内参数 |
| --- | --- |
| `/model` | 不接受 |
| `/ide` | 接受 |
| `/permissions` | 不接受 |
| `/keymap` | 接受 |
| `/vim` | 不接受 |
| `/setup-default-sandbox` | 不接受 |
| `/sandbox-add-read-dir` | 接受 |
| `/experimental` | 不接受 |
| `/approve` | 不接受 |
| `/memories` | 不接受 |
| `/skills` | 不接受 |
| `/import` | 不接受 |
| `/hooks` | 不接受 |
| `/review` | 接受 |
| `/rename` | 接受 |
| `/new` | 接受 |
| `/archive` | 不接受 |
| `/delete` | 不接受 |
| `/resume` | 接受 |
| `/fork` | 接受 |
| `/app` | 不接受 |
| `/init` | 不接受 |
| `/compact` | 不接受 |
| `/plan` | 接受 |
| `/goal` | 接受 |
| `/agent` | 不接受 |
| `/side` | 接受 |
| `/btw` | 接受 |
| `/copy` | 不接受 |
| `/export` | 接受 |
| `/raw` | 接受 |
| `/diff` | 不接受 |
| `/mention` | 不接受 |
| `/status` | 不接受 |
| `/usage` | 接受 |
| `/debug-config` | 不接受 |
| `/title` | 不接受 |
| `/statusline` | 不接受 |
| `/theme` | 不接受 |
| `/pets`、`/pet` | 接受 |
| `/mcp` | 接受 |
| `/apps` | 不接受 |
| `/plugins` | 不接受 |
| `/logout` | 不接受 |
| `/quit` | 不接受 |
| `/exit` | 不接受 |
| `/feedback` | 不接受 |
| `/rollout` | 不接受 |
| `/ps` | 不接受 |
| `/stop`、`/clean` | 不接受 |
| `/clear` | 接受 |
| `/personality` | 不接受 |
| `/test-approval` | 不接受 |
| `/subagents` | 不接受 |
| `/debug-m-drop` | 不接受 |
| `/debug-m-update` | 不接受 |

常见带参入口：`/goal <objective>` 或生命周期动作；`/plan <prompt>`；`/rename <name>`；`/mcp verbose`；`/sandbox-add-read-dir <absolute_path>`。未启动 TUI 核对账户实际菜单，也未执行这些命令。交互参考见[官方 Developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)，其内容可能新于本机版本。

## 来源与刷新

- 本页所有原始帮助均由 `codex-cli 0.154.0` 的本机入口获取，采集日期 2026-09-15。
- [当前适配器](../../src/build-command.ts) 决定 harness-swarm 实际传入的 argv；原生支持不等于 swarm 已接入。
- [官方 CLI reference](https://developers.openai.com/codex/cli/reference/) 在采集时重定向到 Developer commands；在线文档属于滚动版本。
- 本机二进制升级后，按索引重新采集每层帮助。需验证 goal 程序化行为时，应针对安装版本的 App Server 协议测试，不能以源码示例或一次 `--help` 成功替代真实端到端验证。
