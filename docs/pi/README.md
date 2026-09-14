# Pi

本机版本：**pi 0.84.1（@earendil-works/pi-coding-agent）**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
pi --mode json -p --exclude-tools ask_question
  --session-dir <runDir>/pi-sessions --name harness-<runId>
  [--thinking <effort>] [<native_args...>]
  @<brief.md> "Execute the brief. Do not ask questions."
  --approve [--model <model>] [--no-session]
```

以上是 argv 的阅读形式，方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | `--model`，可使用 Pi 原生的 provider/id 或模型模式 |
| `effort` | `--thinking`；本机 off / minimal / low / medium / high / xhigh / max |
| `persist_session` | 默认保留在本次 run 的 pi-sessions；false 添加 `--no-session` |
| `native_args` | 例如 provider、tools、system-prompt、extension、skill、resume / session |
| `goal / max_turns / token_budget / max_budget_usd` | 不支持；扩展自行提供的 goal 不属于内置能力承诺 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

任务正文写到 brief.md，再通过 Pi 的 `@file` 机制读取。默认 `--approve` 是对项目指令/扩展的信任，不是其他 harness 的 yolo 别名；显式原生 `--no-approve` 等选项替换这个默认值。

Pi 每次使用新的 run 会话目录。`persist_session=true` 保留原生会话，false 不保存；它不等于复用旧 worktree。恢复已有 session 需要原生 session/resume 参数指向目标。内置参数与 slash 注册没有 Goal 执行协议，扩展可动态注册额外能力。

## 示例

```bash
node dist/src/cli.js run --name pi --repo /absolute/path/to/project \
  --prompt "修复指定测试" --effort high --persist-session
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
