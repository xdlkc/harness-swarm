# Harness Swarm

通过 CLI 或 Codex 插件（Skill + MCP）把一个 coding harness 调度到独立 Git worktree，返回日志、退出状态和 diff 证据。每次调用运行一个 harness，不自动合并。

## 支持范围

下表是 **harness-swarm 的结构化字段**，不是各 CLI 原生能力的全集。原生子命令和参数见每个 harness 的 reference；可透传的任务参数使用 `native_args`。

| harness | 本机版本 | model | effort | max_turns | goal | token_budget | max_budget_usd | persist_session |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [qoder](docs/qoder/README.md) | 0.1.20 | ✓ | — | ≥0 | — | — | — | — |
| [kimi](docs/kimi/README.md) | 0.41.0 | ✓ | — | — | ✓ | — | — | — |
| [pi](docs/pi/README.md) | 0.84.1 | ✓ | ✓ | — | — | — | — | ✓ |
| [grok](docs/grok/README.md) | 1.0.13 | ✓ | ✓ | ≥1 | ✓ | Goal | — | — |
| [codex](docs/codex/README.md) | 0.154.0 | ✓ | ✓ | — | ✓ | Goal | — | ✓ |
| [claude](docs/claude/README.md) | 2.1.177 | ✓ | ✓ | ≥1 | ✓ | Task | ✓ | ✓ |
| [dsh](docs/dsh/README.md) | 0.1.1-rc.2 | profile | — | — | — | — | — | — |
| [opencode](docs/opencode/README.md) | 1.18.21 | ✓ | ✓ | — | — | — | — | — |

全部支持 `native_args` 和 runner 的 `timeout_ms`。`Goal` 预算要求 `goal=true`；Claude 的 `Task` 预算不要求 Goal。DSH 通过 profile 配置模型，传 `model` 会报错。`—` 表示 swarm 不接受该能力，不表示任意新版本或插件都不可能提供它。版本参考采集日期为 2026-09-15。

| harness | 完整原生参考 |
| --- | --- |
| qoder / kimi | [Qoder](docs/qoder/reference.md) · [Kimi](docs/kimi/reference.md) |
| pi / grok | [Pi](docs/pi/reference.md) · [Grok](docs/grok/reference.md) |
| codex / claude | [Codex](docs/codex/reference.md) · [Claude Code](docs/claude/reference.md) |
| dsh / opencode | [DSH](docs/dsh/reference.md) · [OpenCode](docs/opencode/reference.md) |

## 使用

```bash
npm install
npm test
node dist/src/cli.js --help
node dist/src/cli.js list
```

`list` / MCP `list_harnesses` 返回安装位置、版本和 `capabilities`。这不是登录或模型调用可用性检查；各 CLI 需要已有的配置和认证。

```bash
# Claude：Goal、推理强度、美元上限、会话持久化
node dist/src/cli.js run --name claude --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" \
  --effort high --max-budget-usd 2 --persist-session

# Codex：原生 App Server Goal 协议与 token 预算
node dist/src/cli.js run --name codex --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" --token-budget 20000

# OpenCode：任务入口的原生 agent 参数
node dist/src/cli.js run --name opencode --repo /absolute/path/to/project \
  --prompt "完成指定任务" -- --agent build

# DSH：在固定 headless profile 上叠加配置 patch
node dist/src/cli.js run --name dsh --repo /absolute/path/to/project \
  --prompt "完成指定任务" \
  --native-args '["--patch","/absolute/path/to/overlay.yml"]'
```

CLI 使用 `--max-turns`、`--token-budget` 等连字符名称；MCP 对应 `max_turns`、`token_budget`。`--goal` / `--persist-session` 可写 `=true` 或 `=false`。以 `--` 开头的 prompt 使用 `--prompt=...`。

`native_args` 是 string 数组。CLI 可以用 JSON 数组或 `--` 后的 argv，二者不能并用。不支持的字段、错误类型、坏数字、空 prompt、重复字段或冲突原生参数直接报错，不会静默忽略。native_args 只扩展既定任务入口，不支持透传 `auth`、`mcp`、`upgrade`、`exec resume` 等子命令，也不能覆盖 runner 的任务正文、工作目录和输出协议。

已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

默认权限配方见各 harness README。显式原生权限模式会替换相应默认 bypass；Kimi `-p` 的固定 auto 行为和 Codex Goal 协议另有约束。模型、预算、工具等参数的原生取值仍受 CLI 版本与 provider 支持限制。

## Goal、恢复与结果

`goal=true` 时 prompt 只写目标，不重复加 `/goal`。Claude、Kimi、Grok 通过原生 Goal prompt 入口执行；Codex 使用 `thread/goal/set` 等 App Server 协议。Codex 的协议状态和 Kimi 原生 `goal.summary` 状态写入 `goal_status`；Kimi 缺少 complete 事件时不能只凭退出 0 宣告完成。Claude/Grok 需读取原生 verdict、退出码和流式证据，不能把退出 0 或一句“完成了”默认当成目标完成。

真实 Goal 专项中 Codex、Kimi 已确认 complete；Claude 流式调用写入/读回成功但没有公开 Goal met 状态；Grok 已启动原生 Goal 和独立审核，但在 150.399 秒超时前尚未裁决，不能称为完成。详见 [验证记录](docs/design.md#验证记录)。

`persist_session` 仅用于 Codex、Claude、Pi 的原生会话保存。原生 `--resume` / `--continue` 参数恢复的是 harness 会话历史；每次 swarm 调度仍新建 worktree，不自动恢复旧工作目录。Codex 的原生 resume/fork 是子命令，当前不通过 native_args 调度。普通 Codex、Claude 任务默认不保存会话；Pi 默认保存到本次 run 目录；Codex Goal 要求持久线程。

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

结果包含 `exit_code`、`timed_out`、`summary`、`argv`、日志路径、diff 路径、worktree、base/head SHA 与 `notes`。CLI 遇到失败 Evidence 返回非零退出状态。[设计与真实冒烟记录](docs/design.md) 说明验证范围。

## Codex 插件

把此目录安装为本地插件。MCP `cwd` 为插件根目录；`run_harness` 的 `repo_root` 必须显式传用户当前 Git 仓库的绝对路径。

```json
{
  "name": "claude",
  "prompt": "修复指定测试，直到测试全部通过",
  "repo_root": "/absolute/path/to/project",
  "goal": true,
  "effort": "high",
  "max_budget_usd": 2,
  "persist_session": true,
  "timeout_ms": 1200000
}
```
