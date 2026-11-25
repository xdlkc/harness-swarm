# Harness Swarm

[English](./README.md) | 简体中文

**Harness Swarm（`hs`）** 是命令行工具与 Codex 插件（Skill + MCP），用于将编程 Agent harness 调度到独立的 Git worktree 中执行，并返回日志、退出状态与 diff 证据。每次调用运行一个 harness，绝不自动合并代码。

- **支持 9 款主流 Harness**：统一结构化参数与严格 `native_args` 透传，覆盖 `qoder`、`kimi`、`pi`、`grok`、`codex`、`claude`、`dsh`、`opencode` 与 `opencode2`。
- **跨 Harness 会话历史**：通过 `hs sessions list` / `search` 统一检索原生会话元数据，并在新建 Git worktree 中 `resume` 或 `fork` 历史会话。
- **全局规则与内置 Skill 管理**：通过 `hs rules` 与 `hs skills` 用软链将同一份 `AGENTS.md` 和 Skill 集合同步到所有已安装的 Harness 配置目录。

## 支持范围

下表为 **harness-swarm 的结构化字段**（并非各 CLI 原生能力的全部；更多任务参数可通过 `native_args` 透传）：

| Harness | 参考版本 | `model` | `effort` | `max_turns` | `goal` | `token_budget` | `max_budget_usd` | `persist_session` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [qoder](./docs/qoder/README.md) | 0.1.20 | ✓ | — | ≥0 | — | — | — | — |
| [kimi](./docs/kimi/README.md) | 0.41.0 | ✓ | — | — | ✓ | — | — | — |
| [pi](./docs/pi/README.md) | 0.84.1 | ✓ | ✓ | — | — | — | — | ✓ |
| [grok](./docs/grok/README.md) | 1.0.13 | ✓ | ✓ | ≥1 | ✓ | Goal | — | — |
| [codex](./docs/codex/README.md) | 0.154.0 | ✓ | ✓ | — | ✓ | Goal | — | ✓ |
| [claude](./docs/claude/README.md) | 2.1.177 | ✓ | ✓ | ≥1 | ✓ | Task | ✓ | ✓ |
| [dsh](./docs/dsh/README.md) | 0.1.1-rc.2 | profile | — | — | — | — | — | — |
| [opencode](./docs/opencode/README.md) | 1.18.21 | ✓ | ✓ | — | — | — | — | — |
| [opencode2](./docs/opencode2/README.md) | 0.0.0-beta | ✓ | — | — | — | — | — | — |

全部支持 `native_args` 与 runner 的 `timeout_ms`。`Goal` 预算要求 `goal=true`；Claude 的 `Task` 预算不要求 Goal。`dsh` 通过 profile 配置模型，传入 `--model` 会报错。各 CLI 完整原生参考见 [`docs/`](./docs/design.md)。

## 快速开始

安装并链接独立 CLI 命令 `hs`（也可通过 `npm run cli -- <参数>` 运行）：

```bash
npm install
npm link
hs --help
hs list
```

`hs list` / MCP `list_harnesses` 返回安装位置、版本和声明的 `capabilities`，不检查实时登录态或模型额度。

```bash
# Claude：Goal、推理强度、美元上限、会话持久化
hs run --name claude --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" \
  --effort high --max-budget-usd 2 --persist-session

# Codex：原生 App Server Goal 协议与 token 预算
hs run --name codex --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" --token-budget 20000

# OpenCode：通过 -- 透传原生任务参数
hs run --name opencode --repo /absolute/path/to/project \
  --prompt "完成指定任务" -- --agent build

# DSH：在固定 headless profile 上叠加配置 patch
hs run --name dsh --repo /absolute/path/to/project \
  --prompt "完成指定任务" \
  --native-args '["--patch","/absolute/path/to/overlay.yml"]'
```

CLI 使用 `--max-turns`、`--token-budget` 等连字符参数；MCP 对应 `max_turns`、`token_budget`。不支持的字段、错误类型、空 prompt、重复字段或试图经 `native_args` 偷渡子命令（如 `auth`、`mcp`、`upgrade`、`exec resume`）都会直接报错，不会静默忽略。

## 会话历史查询（`hs sessions`）

`hs sessions` 仅读取元数据（不加载完整 transcript）进行检索，并在新建 worktree 中延续或分叉会话：

```bash
hs sessions list
hs sessions list --name codex --limit 20
hs sessions search "refactor" --cwd /absolute/path/to/project
hs sessions resume --name claude --session <id> --prompt "继续修复测试" --repo /abs/path
hs sessions fork   --name opencode2 --session <id> --prompt "换一个方向重试" --repo /abs/path
```

| Harness | 数据源 | 搜索字段 | `resume` | `fork` |
| --- | --- | --- | --- | --- |
| `qoder` | `~/.qoder/projects/*/<uuid>-session.json` | `title` | ✓ | — |
| `kimi` | `~/.kimi-code/session_index.jsonl` + `state.json` | `title` / `lastPrompt` | ✓ | — |
| `pi` | `~/.pi/agent/sessions/*/*.jsonl` 首行 | `cwd` + 首条用户文本 | ✓ | ✓ |
| `grok` | `~/.grok/sessions/*/*/summary.json` | `title` / `summary` | ✓ | ✓ |
| `codex` | `~/.codex/session_index.jsonl` | `thread_name` | ✓ | ✓ |
| `claude` | `~/.claude/projects/*/sessions-index.json` | `summary` / `firstPrompt` | ✓ | ✓ |
| `opencode2` | `opencode2 api v2.session.list` | 原生 `search` 参数 | ✓ | ✓ |

## 全局规则与内置 Skill（`hs rules` / `hs skills`）

将 [`assets/rules/AGENTS.md`](./assets/rules/AGENTS.md) 与 [`assets/skills.json`](./assets/skills.json)（以及仓库内自建的 `assets/skills/<name>/SKILL.md`）软链到各 Harness 的用户级配置目录（`~/.codex/`、`~/.claude/`、`~/.qoder/`、`~/.kimi-code/`、`~/.pi/agent/`、`~/.grok/`、`~/.config/opencode/`）：

```bash
hs rules                          # 查看各 harness 的软链状态
hs rules link --dry-run           # 预览变更
hs rules link --force             # 已有规则文件先备份再建软链
hs rules unlink                   # 仅删除 hs 创建的软链

hs skills list                    # 查看 Skill 清单与安装状态
hs skills install                 # 终端交互式多选列表
hs skills install --skill 'grill-me'
hs skills install --all --name claude,codex
hs skills update                  # 更新已克隆 Skill 仓库并补齐软链
hs skills uninstall
```

目标位置已有普通文件或其他工具软链时记为 `conflict` 并默认跳过，加 `--force` 才先备份再替换。

## Goal 执行、证据与 Codex 插件

- **Goal 模式**：传 `--goal` 时 prompt 只写目标正文（不重复写 `/goal`）。Codex 走 App Server `thread/goal/set` 协议；Kimi、Claude、Grok 走各自原生 Goal 入口并校验状态裁决。详见 [`docs/design.md`](./docs/design.md)。
- **证据与脱敏**：结果返回 `exit_code`、`timed_out`、`summary`、脱敏后的 `argv`、日志路径、diff 路径、worktree、base/head SHA、`notes` 与 `native_session_id`（支持时）。`argv` 和命令头中的凭据参数会自动替换为 `[REDACTED]`。
- **Codex 插件**：可将本目录注册为本地 Codex 插件（[`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json)、[`mcp.json`](./mcp.json)）。MCP 进程以插件根目录启动，调用 `run_harness` 时需显式传入目标 Git 仓库的绝对路径 `repo_root`。

## 目录结构

```text
harness-swarm/
├── package.json                # Node/TypeScript 包配置（CLI 命令 hs，MIT）
├── .codex-plugin/plugin.json   # Codex 插件清单
├── mcp.json                    # MCP 服务配置
├── bin/harness-swarm-mcp       # MCP stdio 启动脚本
├── assets/
│   ├── rules/AGENTS.md         # 全局规则源文件
│   └── skills.json             # 外部 Skill 仓库清单
├── skills/dispatch-harness/    # Codex 调度 Skill
├── docs/                       # 设计文档与各 Harness 原生 CLI 参考
├── src/                        # CLI、调度器、命令构造、会话查询、MCP 与软链管理
└── test/                       # 单元测试与集成测试
```

## 验证

```bash
npm test
```

## 许可证

采用 **MIT** 许可证（声明于 [`package.json`](./package.json)）。
