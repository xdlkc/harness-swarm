# Grok Build

本机版本：**grok 1.0.13 (5e9a58528b76) [stable]**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
grok --cwd <worktree> --prompt-file <brief.md>
  --output-format json --no-subagents --verbatim --always-approve
  [-m <model>] [--max-turns <N>] [--reasoning-effort <effort>]
  [<native_args...>]
```

以上展示普通任务配方；`goal=true` 使用 `--output-format streaming-json` 并不默认添加 `--no-subagents`，允许原生 Goal 的内部验证角色工作。方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | `-m <model>` |
| `effort` | `--reasoning-effort <effort>` |
| `max_turns` | `--max-turns`，正整数 |
| `goal` | `true` 时把 `/goal <objective>` 写入 brief.md |
| `token_budget` | 仅 goal=true；追加到 Goal 命令的 `--budget <tokens>` |
| `native_args` | 例如 `--json-schema`、`--rules`、`--allow`、`--deny`、`--permission-mode`、`--resume` |
| `max_budget_usd / persist_session` | 不支持 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

Goal 的预算在 `/goal <objective> --budget <tokens>` 文本中传递，不是 Grok 根 CLI 的 `--token-budget`。prompt 写目标正文；swarm 会拒绝已带 `/goal` 或只有 status/pause 等管理动作的输入。

日志和退出状态保留 Grok 的原生 verdict，runner 不将退出 0 单独解释为已完成目标。普通任务默认 `--no-subagents --verbatim`；Goal 仍保留 verbatim，但不默认禁用内部 subagents。权限模式可由 native_args 显式替换。Grok 的 agent stdio/headless/serve/leader 是另一类原生子命令，不属于 native_args 任务选项入口。

## 示例

```bash
node dist/src/cli.js run --name grok --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试通过" --token-budget 20000 --effort high
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

普通任务实跑成功。Goal 的 streaming-json 重试耗时 **150.399 秒**后超时，退出 **124**；共捕获 **738 条 NDJSON**，出现 write → read → 独立审核，task state 包含 goal_created / worker_completed，仍为 active、phaseExecuting、1 worker round，审核尚未裁决。没有认证错误；确实启动了原生 Goal，但未验证完成。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
