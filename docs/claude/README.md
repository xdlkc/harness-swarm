# Claude Code

本机版本：**2.1.177 (Claude Code)**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
claude -p --output-format json --dangerously-skip-permissions
  [--no-session-persistence] [--model <model>] [--max-turns <N>]
  [--effort <effort>] [--task-budget <tokens>] [--max-budget-usd <amount>]
  [<native_args...>] -- <prompt-or-goal>
```

以上展示普通任务配方；`goal=true` 改为 `--output-format stream-json --verbose`，以保留目标判断过程。方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | `--model <model>` |
| `effort` | `--effort <effort>` |
| `max_turns` | `--max-turns`，正整数；本机隐藏注册参数 |
| `goal` | true 将 prompt 转换为 `/goal <objective>` |
| `token_budget` | `--task-budget <tokens>`，任务预算；不要求 goal=true |
| `max_budget_usd` | `--max-budget-usd <amount>`；有限正数 |
| `persist_session` | 默认关闭；true 移除 `--no-session-persistence` |
| `native_args` | 例如 system-prompt、allowedTools、json-schema、agent、resume；与结构化字段不得重复 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

本机 `/goal` 注册支持非交互运行；swarm 的 goal=true 将目标正文编码为该会话命令，而不是添加 Claude 不存在的 `--goal` 原生 flag。目标最长 4000 字符。不能把 `--task-budget`、美元上限和目标完成条件当成同一概念。

Claude 原生流式 JSON、退出码和日志用于判断结果；swarm 不添加协议确认的 goal_status，也不默认把退出 0 当成目标完成。模型/账户开关和 evaluator 的实际支持仍应看原生 verdict。

恢复可通过 native_args 的 `--resume` / `--continue` 使用；普通任务需要 persist_session=true。建议 Goal 也显式打开持久化，便于后续原生恢复。每次 swarm 调用仍创建新 worktree，不恢复旧代码目录。在线文档中针对更高版本的恢复修复不能套到 2.1.177。

## 示例

```bash
node dist/src/cli.js run --name claude --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试通过" --effort high \
  --max-budget-usd 2 --token-budget 20000 --persist-session
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

普通任务实跑成功。Goal 的 stream-json 重试耗时 **54.288 秒**，退出 0、无超时，完成 Write → Read 并核对精确文件内容；但公开事件流没有 goal-status / Goal met，通用 completed 不能证明目标完成。因此本次验证到了任务执行和文件结果，未确认 Goal met。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
