# DSH CLI reference

## 当前 swarm 接入与快照范围

本页原始 help/source 快照保持采集时内容；现行结构化参数、`native_args` 透传、Goal、权限及持久化映射见 [README.md](README.md)。未支持的 swarm 字段会提前报错，不再忽略。native_args 按已记录任务选项的参数数量校验；未记录/扩展 flag 的值需 `--flag=value`，游离子命令和保留字段覆盖会被拒绝。原生子命令清单不代表它们都能通过 native_args 执行。帮助采集的“未执行任务”只描述采集过程；随后普通模型任务冒烟记录见 [design.md](../design.md#验证记录)，不等于穷尽高级参数或 Goal 实测。


## 版本与覆盖范围

- 采集日期：2026-09-15（Asia/Shanghai）。
- 命令：`/usr/local/bin/dsh`。
- 实际入口：`/usr/local/lib/node_modules/@deepseek-ai/dsh/lib/bin.js`。
- `dsh --version`：`0.1.1-rc.2`，与安装包 `package.json` 一致。
- 范围：本版本启动器全部已注册子命令和 flags、随包内置 `web` / `headless` 应用全部公开参数；自定义 profile 或 pnpm 的完整命令树不属于 DSH 自身命令树。
- 证据：以下本机帮助原文与已安装包源码。没有执行配置 dump，也没有读取或刊出用户凭据。除明确标注失败项，帮助退出码均为 0。

## 命令索引与参数归属

| 入口 | 参数 |
|---|---|
| `dsh` | `-V, --version`、`--profile <name>`、重复 `--patch <path>`、`--dump-config`、`--dump-default-config`；无 profile 的 `-h / --help` 显示启动器帮助 |
| `dsh web [args...]` | 启动器层：重复 `--patch <path>`、`--dump-config`、`--dump-default-config`；其余转交 web 应用 |
| `dsh plugin --profile <name> [args...]` | 必填 `--profile <name>`；剩余参数转交 profile 目录内的 pnpm |
| `dsh --profile web` | 应用层：`--host <host>`、`--no-open`、`--port <port>`、`--trusted-host <authority...>`、`-h / --help` |
| `dsh --profile headless [task...]` | 应用层：task 可多词，以空格合并；`-h / --help` |
| `dsh --profile <自定义名称> [args...]` | 动态插件应用决定参数；不是一个固定内置命令列表 |

启动器参数必须在应用参数前；遇到第一个不认识的 token 后，剩余 argv 转发给应用。`web`、`plugin` 子命令拒绝写在它们之前的父层 `--profile`、`--patch`、`--dump-config`、`--dump-default-config`。例如 profile 必须写作 `dsh plugin --profile <name> …`。

`--dump-config` 与 `--dump-default-config` 互斥；dump 不接受应用参数；`--dump-default-config` 不接受 `--patch`。`--patch` 每次只收一个路径，可重复；空 profile / 空 patch 会报错。

## 本机帮助快照

### `dsh --help`

退出码：`0`。

```text
Usage: dsh [options] [command] [args...]

dsh: boot a DeepSeek Harness profile — an ordered stack of plugin-bundle patch
layers under your own overrides.

Arguments:
  args                        arguments for the booted profile's app (see: dsh
                              --profile <name> --help)

Options:
  -V, --version               output the version number
  --profile <name>            the profile under $DSH_HOME/profiles to boot
  --patch <path>              extra patch-list overlay applied after the profile
                              layer (repeatable)
  --dump-config               print the composed profile tree and exit
  --dump-default-config       print the profile tree without its user layer or
                              --patch overlays and exit

Commands:
  web [options] [args...]     boot the web profile (alias of --profile web); the
                              web app's own flags follow
  plugin [options] [args...]  manage a profile's plugins by forwarding the
                              remaining arguments to pnpm in the profile
                              directory

Examples:
  dsh --profile web                          boot the web profile (same as: dsh web)
  dsh --profile headless "run the tests"     answer one task, print the result, and exit
  dsh --profile tui --patch ./extra.yml      boot a custom profile with one extra overlay
  dsh --profile tui --resume <session>       arguments after the launcher flags reach the app
  dsh --profile web --help                   the web app's own flags and help
  dsh plugin --profile tui add <package>     install a plugin into the tui profile
```

### `dsh plugin --help`

退出码：`1`。

```text
error: required option '--profile <name>' not specified
```

### `dsh web --help`

退出码：`0`。

```text
Usage: dsh --profile web [options]

Serve the DeepSeek Harness browser UI.

Options:
  --host <host>                  bind host
  --no-open                      do not open the Web UI in the default browser
  --port <port>                  listen port; pass 0 to let the OS pick a free
                                 one
  --trusted-host <authority...>  extra authority the /api browser-trust fence
                                 accepts (host or host:port; repeatable)
  -h, --help                     show this help

Examples:
  dsh --profile web                          serve on the composed host and port
  dsh --profile web --no-open                serve without opening a browser
  dsh --profile web --port 8080              serve on another port
```

### `dsh --profile web --help`

退出码：`0`。

```text
Usage: dsh --profile web [options]

Serve the DeepSeek Harness browser UI.

Options:
  --host <host>                  bind host
  --no-open                      do not open the Web UI in the default browser
  --port <port>                  listen port; pass 0 to let the OS pick a free
                                 one
  --trusted-host <authority...>  extra authority the /api browser-trust fence
                                 accepts (host or host:port; repeatable)
  -h, --help                     show this help

Examples:
  dsh --profile web                          serve on the composed host and port
  dsh --profile web --no-open                serve without opening a browser
  dsh --profile web --port 8080              serve on another port
```

### `dsh --profile headless --help`

退出码：`0`。

```text
Usage: dsh --profile headless [options] [task...]

Answer one task, print the final assistant message, and exit.

Arguments:
  task        the task text; multiple words are joined by spaces

Options:
  -h, --help  show this help

Examples:
  dsh --profile headless "run the tests"     answer one task and exit
```

## `web` 启动器层和 `plugin` 源码补证

`dsh web --help` 输出的是 web 应用帮助，因此不会显示外层 `--patch`、dump flags。安装包 `lib/bin.js` 的 `web` 注册链完整声明了这些选项，已列在上表。web 应用 `startup.js` 还验证：`--port` 必须全部由数字构成；`--host 0.0.0.0` 被该版本显式拒绝。

`dsh plugin --help` 实测先报缺少必填 `--profile`，没有可用的独立帮助页。没有为了抓取帮助而运行 `dsh plugin --profile … --help`：安装包源码显示这一路径会进入 profile 初始化 / pnpm 转发 / 插件协调流程，不能作为纯帮助查询。完整的 DSH 参数声明如下，摘自安装包 `lib/bin.js`：

```javascript
program.command("plugin")
  .description("manage a profile's plugins by forwarding the remaining arguments to pnpm in the profile directory")
  .requiredOption("--profile <name>", "the profile whose plugins to manage (initialized on first use)")
  .allowUnknownOption()
  .argument("[args...]", "pnpm arguments, forwarded verbatim (add <pkg>, remove <pkg>, why <pkg>, ...)");
```

`plugin` 没有自身的 `add/remove/why` 子命令；它们是 pnpm 参数，DSH 还要求至少有一个待转发参数。`lib/plugin-9h8shc4d.js` 先初始化 profile（若不存在）、调用 `spawnSync("pnpm", …)`、成功后协调插件 manifest；找不到 pnpm 时退出 127。相对本地包路径按原调用目录锚定。

## Profile 配置、隐藏参数与 slash

随包 README 明确配置组合顺序：空树 → `dsh.profile.bundles` 按顺序 → profile 的 `cordis.patch.yml` → home 层 `cordis.patch.yml` → CLI `--patch`。`web`、`headless` 可从随包模板自动初始化；其他名称依赖用户创建的 profile。因此静态文档无法穷尽未来安装的插件参数。

已安装 `dsh-headless/lib/startup.js` 的 Commander 注册仅含 `[task...]` 和 `-h / --help`；没有隐藏的 model、resume、goal、预算、最大轮次参数。`lib/index.js` 使用 profile 提供的 `agentDefaultModel.currentSelection()`、新建随机 session ID、调用 `agent.followup(createUserMessage(...))`，等待 idle 后 flush 会话，输出最后一段 assistant 文本；正常 completed 返回 0，其他结束状态返回 1。不存在 headless slash 命令分发，`/goal` 不会自动成为 Goal API。

这是内置 headless 的结论，不限制第三方 profile 通过插件引入额外能力。自定义 TUI profile 尚未执行帮助核验。

## 一手来源与复核

- [本仓库适配代码](../../src/build-command.ts)。
- 安装包 `/usr/local/lib/node_modules/@deepseek-ai/dsh/README.md`：Entry modes、App arguments、Profiles。
- 安装包 `lib/bin.js`：`parseDshArgs`、`resolveBoot`。
- 安装包 `lib/plugin-9h8shc4d.js`：`runPlugin`。
- 安装包 `node_modules/@deepseek-ai/dsh-headless/lib/startup.js`、`lib/index.js`。
- 安装包 `node_modules/@deepseek-ai/dsh-web-app/lib/startup.js`。

```bash
dsh --version
dsh --help
dsh --profile headless --help
dsh --profile web --help
```

以上都是本机版本事实，不使用最新版网站描述替代本机行为。未执行真实模型、恢复、插件安装或配置修改验证。
