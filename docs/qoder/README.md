# Qoder

本机版本：**qodercli 0.1.20**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
qodercli -w <worktree> -p <prompt> -f json --quiet --yolo
  [--model <model>] [--max-turns <N>] [<native_args...>]
```

以上是 argv 的阅读形式，方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `model` | `--model`；本机枚举 auto / efficient / lite / performance / ultimate |
| `max_turns` | `--max-turns`；允许 0，表示不设轮次上限 |
| `native_args` | 任务入口的原生参数，例如 allowed-tools、attachment、resume |
| `effort / goal / token_budget / max_budget_usd / persist_session` | 不支持；传入不支持的能力会报错 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

原生 `-c/--continue`、`-r/--resume` 可通过 native_args 传入，但 runner 每次仍新建 worktree。`--max-output-tokens` 是单次模型输出限制，不等于整个任务的 token 预算；可通过 native_args 使用。

本机旧版 `qodercli --workspace` 与现行网站的 `qoder --cwd` 不同。新网站的 `/goal` 文档不能证明 0.1.20 的 headless Goal 可用，因此 swarm 拒绝 qoder 的 goal=true。MCP、jobs、安装等管理子命令只记录在 reference，不通过 native_args 调度。

## 示例

```bash
node dist/src/cli.js run --name qoder --repo /absolute/path/to/project \
  --prompt "修复指定测试" --model efficient --max-turns 10
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
