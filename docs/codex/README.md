# Codex

本机版本：**codex-cli 0.154.0**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
codex exec --json [--ephemeral]
  --dangerously-bypass-approvals-and-sandbox --cd <worktree>
  [--model <model>] [-c model_reasoning_effort="<effort>"]
  [<native_args...>] -- <prompt>
```

以上是 argv 的阅读形式，方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。Codex Goal 的专用协议例外见下文。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | 普通 exec 用 `--model`；Goal 用 `thread/start.model` |
| `effort` | 普通 exec 用 `-c model_reasoning_effort=...`；Goal 写入线程配置 |
| `goal` | true 选择 App Server 协议执行器，调用 `thread/goal/set` |
| `token_budget` | 仅 goal=true；映射 `thread/goal/set.tokenBudget` |
| `persist_session` | 普通 exec 默认临时，true 移除 `--ephemeral`；Goal 必须持久化，不能显式 false |
| `native_args` | 普通 exec 任务选项；Goal 模式仅 config/enable/disable/strict-config 及对应值 |
| `max_turns / max_budget_usd` | 不支持 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

### Codex Goal 协议

`goal=true` 不会执行 `codex exec "/goal …"`。它启动 `codex app-server --enable goals --stdio`，初始化实验协议、创建 worktree 对应的持久线程、调用 `thread/goal/set`（objective / tokenBudget），并跟踪 goal 更新与 turn 生命周期。

只有 App Server 返回的目标终态用于填充 `evidence.goal_status`；目标 complete 与普通 turn 结束分开处理。协议错误、异常关闭、阻塞/预算终态、超时不能仅因产生了文本而被当成完成。目标需 1–4000 字符。

Goal 模式的 native_args 仅接受 `--config/-c`、`--enable`、`--disable`、`--strict-config`；不允许关闭 goals 功能或覆盖 runner 拥有的传输/工作目录。该协议执行器固定使用 never 审批和 danger-full-access 沙箱策略，不能通过普通 exec 权限 flags 替换。

### 会话边界

普通 exec 默认 `--ephemeral`，persist_session=true 才保留会话。Codex 原生恢复采用 `exec resume` / `exec fork` 子命令，而 native_args 不允许管理/执行子命令，所以当前 swarm 不提供 Codex 的跨调用 resume/fork。持久化不等于恢复，也不自动复用旧 worktree。环境沿用父进程已有配置和认证。

## 示例

```bash
node dist/src/cli.js run --name codex --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试通过" --token-budget 20000 --effort high
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

真实 Goal（`effort=low`）约 26.3 秒完成：`thread/goal/set` 返回 active，随后 complete，并等待 turn/completed；`goal_status=complete`，精确文件内容、读回和单行 patch 均验证通过。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
