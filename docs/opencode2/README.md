# OpenCode 2

本机版本：**opencode2 v0.0.0-beta-19192**（"OpenCode 2.0 preview"，Go 重写）；参考采集日期：**2026-09-20**。完整子命令、参数、会话 API 与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

opencode2 是 client-server 架构：会话存于后台 service（或 `--standalone` 私有 server），通过 HTTP API 访问。二进制默认位于 `~/.opencode/bin/opencode2`，不在 `PATH`；`hs list` 与 `hs sessions` 会回退到该已知路径。它与 opencode v1 是**两个独立 harness 名**（`opencode` 与 `opencode2`），共享 `~/.local/share/opencode` 数据目录。

## 任务入口

```text
opencode2 run --format json --auto
  [--model <provider/model#variant>] [--agent <name>] [<native_args...>] -- <prompt>
```

以上是 argv 的阅读形式，方括号为可选项，不经 shell 二次展开。`run` 没有 `--dir`，工作目录由 runner 以 cwd 传入（即本次 worktree）；默认 `--auto` 在提供受支持的显式原生权限参数时被替换。此入口按项目惯例构造，尚未在真实 agent 上冒烟（会调用模型产生费用），resume/fork 落地时一并验证。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | `--model <provider/model#variant>`（原生格式用 `#` 分隔 variant） |
| `native_args` | 例如 `--agent`、`--file`、`--title`、`--thinking`、`--auto` |
| `effort / goal / max_turns / token_budget / max_budget_usd / persist_session` | 不支持并报错 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符，MCP 使用下划线。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`。

## 会话历史

opencode2 是 8 个 harness 中会话能力最完整的：`hs sessions` 通过原生 HTTP API 查询（不是解析文本或读 SQLite），resume/fork 走 `opencode2 run`。

```bash
hs sessions list --name opencode2 --limit 20
hs sessions search "风扇" --name opencode2
hs sessions resume --name opencode2 --session ses_xxx --prompt "继续" --repo /abs/path
hs sessions fork   --name opencode2 --session ses_xxx --prompt "重试" --repo /abs/path
```

底层 list/search 调用 `opencode2 api v2.session.list`，参数为 `limit`、`order`、`search`、`directory`、`parentID` 等；`search` 是服务端原生过滤。返回的 `Session.Info` 含 `id`、`title`、`location.directory`、`model`、`agent`、`cost`、`tokens`、`time{created,updated}`、`parentID`（fork 血缘）与 `outcome`。resume 映射为 `opencode2 run --session <id> -- <prompt>`，fork 再加 `--fork`。

`opencode`（v1）不在 swarm 暴露会话历史，因为两者共享数据目录，opencode2 的 API 已覆盖同一批会话。

## 示例

```bash
node dist/src/cli.js run --name opencode2 --repo /absolute/path/to/project \
  --prompt "检查项目并完成任务" --model provider/model -- --agent build
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

reference 保存版本化帮助、会话 API 与来源补证；`hs sessions` 的 list/search 已用本机真实数据验证，`run` 与 resume/fork 的真实任务冒烟尚未执行（见 [design.md](../design.md#验证记录)）。
