# DSH

本机版本：**dsh 0.1.1-rc.2**；参考采集日期：**2026-09-15**。完整子命令、参数、别名、默认值、隐藏补证与原始帮助见 [reference.md](reference.md)。本文描述当前 swarm 映射，能力声明以 [capabilities.ts](../../src/capabilities.ts) 和 [build-command.ts](../../src/build-command.ts) 为准。

## 任务入口

```text
dsh [<native_args...>] --profile headless -- -- <prompt>
```

以上是 argv 的阅读形式，方括号为可选项，不经 shell 二次展开。工作目录为 runner 创建的 worktree；默认权限参数在提供受支持的显式原生权限模式时被替换。

## 参数映射

| swarm 字段 | 原生行为 |
| --- | --- |
| `native_args` | 启动器层原生选项；最常用可重复 `--patch <path>` |
| `model / effort / max_turns / goal / token_budget / max_budget_usd / persist_session` | 不支持并报错；模型与权限由 headless profile 配置决定 |

`repo_root` 用于创建独立 worktree；`timeout_ms` 是 runner 时间上限，默认 1,200,000 ms，不传给原生 CLI。CLI 对应字段使用连字符（如 `--token-budget`），MCP 使用下划线（如 `token_budget`）。

原生参数使用 `native_args: string[]`，CLI 用 `--native-args '<JSON array>'` 或 `--` 后的独立 argv，两种形式不能同时用。未知 swarm 字段、错误类型、空 prompt、不支持的能力以及冲突参数会提前报错，不会静默忽略。任务、输出协议、工作目录和执行入口由 runner 保留；native_args 不接受原生子命令。原生参数本身的有效值最终由对应版本 CLI 校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

## 能力边界

DSH 是 profile 启动器。本仓库固定 headless，最终输出 assistant 文本；每次原生运行新建并保存一个会话。启动器和 headless 应用各消费一个 `--`，因此两个分隔符都必须保留。

native_args 的 `--patch` 插在 `--profile headless` 之前，可覆盖 profile 插件配置；不能改 profile 或执行 dump。headless 本身仅解析 task 和 help，没有原生 model/resume/goal/预算 flags。`/goal …` 在该 headless 实现中只是用户文本。自定义 profile 的动态参数不属于此适配。

原生 `web`、`plugin`（pnpm 透传）仅列入 reference，不经 swarm 执行。

## 示例

```bash
node dist/src/cli.js run --name dsh --repo /absolute/path/to/project \
  --prompt "修复指定测试" --native-args '["--patch","/absolute/path/to/overlay.yml"]'
```

## 验证

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

reference 保存版本化帮助和来源补证；真实普通任务冒烟的结果与限制集中记录在 [design.md](../design.md#验证记录)。原生参数存在、模型调用成功和 Goal 被确认完成是三种不同证据；冒烟不代表每个高级组合均已实跑。
