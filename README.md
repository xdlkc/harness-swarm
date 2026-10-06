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
| [opencode2](docs/opencode2/README.md) | 0.0.0-beta | ✓ | — | — | — | — | — | — |

全部支持 `native_args` 和 runner 的 `timeout_ms`。`Goal` 预算要求 `goal=true`；Claude 的 `Task` 预算不要求 Goal。DSH 通过 profile 配置模型，传 `model` 会报错。`—` 表示 swarm 不接受该能力，不表示任意新版本或插件都不可能提供它。opencode2 是 Go 重写的 beta 版，与 opencode v1 是两个独立 harness 名、共享数据目录。版本参考采集日期主体为 2026-09-15，opencode2 为 2026-09-20。

| harness | 完整原生参考 |
| --- | --- |
| qoder / kimi | [Qoder](docs/qoder/reference.md) · [Kimi](docs/kimi/reference.md) |
| pi / grok | [Pi](docs/pi/reference.md) · [Grok](docs/grok/reference.md) |
| codex / claude | [Codex](docs/codex/reference.md) · [Claude Code](docs/claude/reference.md) |
| dsh / opencode | [DSH](docs/dsh/reference.md) · [OpenCode](docs/opencode/reference.md) · [OpenCode 2](docs/opencode2/reference.md) |

## 使用

独立 CLI 命令名为 `hs`。在项目目录安装并链接后使用：

```bash
npm install
npm link
hs --help
hs list
```

也可以在项目目录通过 `npm run cli -- <参数>` 调用。

`list` / MCP `list_harnesses` 返回安装位置、版本和 `capabilities`。这不是登录或模型调用可用性检查；各 CLI 需要已有的配置和认证。

```bash
# Claude：Goal、推理强度、美元上限、会话持久化
hs run --name claude --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" \
  --effort high --max-budget-usd 2 --persist-session

# Codex：原生 App Server Goal 协议与 token 预算
hs run --name codex --repo /absolute/path/to/project \
  --goal --prompt "修复指定测试，直到测试全部通过" --token-budget 20000

# OpenCode：任务入口的原生 agent 参数
hs run --name opencode --repo /absolute/path/to/project \
  --prompt "完成指定任务" -- --agent build

# DSH：在固定 headless profile 上叠加配置 patch
hs run --name dsh --repo /absolute/path/to/project \
  --prompt "完成指定任务" \
  --native-args '["--patch","/absolute/path/to/overlay.yml"]'
```

CLI 使用 `--max-turns`、`--token-budget` 等连字符名称；MCP 对应 `max_turns`、`token_budget`。`--goal` / `--persist-session` 可写 `=true` 或 `=false`。以 `--` 开头的 prompt 使用 `--prompt=...`。

`native_args` 是 string 数组。CLI 可以用 JSON 数组或 `--` 后的 argv，二者不能并用。不支持的字段、错误类型、坏数字、空 prompt、重复字段或冲突原生参数直接报错，不会静默忽略。native_args 只扩展既定任务入口，不支持透传 `auth`、`mcp`、`upgrade`、`exec resume` 等子命令，也不能覆盖 runner 的任务正文、工作目录和输出协议。

已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。

默认权限配方见各 harness README。显式原生权限模式会替换相应默认 bypass；Kimi `-p` 的固定 auto 行为和 Codex Goal 协议另有约束。模型、预算、工具等参数的原生取值仍受 CLI 版本与 provider 支持限制。

## 会话历史查询

`hs sessions` 查询并延续各 harness 的原生会话历史。list/search 只读元数据（id、标题、工作目录、时间戳，不读取完整 transcript）；resume/fork 在新建 worktree 中延续会话并返回 Evidence。`opencode`（v1）与 `dsh` 不暴露会话历史：前者由 opencode2 的 API 覆盖共享存储，后者没有独立 session store。

```bash
hs sessions list                       # 聚合所有支持的 harness，最新在前
hs sessions list --name codex --limit 20
hs sessions search "风扇" --name opencode2
hs sessions search "refactor" --cwd /absolute/path/to/project
hs sessions resume --name claude --session <id> --prompt "继续修复测试" --repo /abs/path
hs sessions fork   --name opencode2 --session <id> --prompt "换一个方向重试" --repo /abs/path
```

| harness | 数据源 | search 字段 | resume | fork |
| --- | --- | --- | --- | --- |
| qoder | `~/.qoder/projects/*/<uuid>-session.json` | title | ✓ | — |
| kimi | `~/.kimi-code/session_index.jsonl` + `state.json` | title / lastPrompt | ✓ | — |
| pi | `~/.pi/agent/sessions/*/*.jsonl` 首行 | cwd + 首条用户文本 | ✓ | ✓ |
| grok | `~/.grok/sessions/*/*/summary.json` | title / summary | ✓ | ✓ |
| codex | `~/.codex/session_index.jsonl` | thread_name | ✓ | ✓ |
| claude | `~/.claude/projects/*/sessions-index.json` | summary / firstPrompt | ✓ | ✓ |
| opencode2 | `opencode2 api v2.session.list` | 原生 `search` 参数 | ✓ | ✓ |

省略 `--name` 时聚合（仅 list/search）；默认 `--limit 50`。codex 只读索引（无 cwd，避免扫 262MB rollout 文件）；pi 的 search 是 cwd + 首条用户文本的有界匹配。resume/fork 恢复的是会话历史，每次仍新建 worktree，不恢复旧工作目录；kimi 的原生 fork 是子命令且不继续 prompt，故 swarm 不暴露 kimi fork。

## 全局规则与内置 Skill

`hs rules` 和 `hs skills` 用软链把同一份规则和同一组 Skill 接到各 harness 的用户级目录。源文件在本仓库内：修改源文件后，所有 harness 立即读到新内容。

| harness | 全局规则软链 | Skill 软链目录 |
| --- | --- | --- |
| qoder | `~/.qoder/AGENTS.md` | `~/.qoder/skills/` |
| kimi | `~/.kimi-code/AGENTS.md` | `~/.kimi-code/skills/` |
| pi | `~/.pi/agent/AGENTS.md` | `~/.pi/agent/skills/` |
| grok | `~/.grok/AGENTS.md` | `~/.grok/skills/` |
| codex | `~/.codex/AGENTS.md` | `~/.codex/skills/` |
| claude | `~/.claude/CLAUDE.md` | `~/.claude/skills/` |
| opencode / opencode2 | `~/.config/opencode/AGENTS.md` | `~/.config/opencode/skills/` |

DSH 没有用户级规则或 Skill 目录，不支持。opencode 与 opencode2 共用同一个配置目录，只建一个软链。

- 全局规则源文件：[`assets/rules/AGENTS.md`](assets/rules/AGENTS.md)。所有软链都指向它；Claude 的入口名是 `CLAUDE.md`。
- 自建 Skill：放在 `assets/skills/<name>/SKILL.md`，直接软链到仓库内目录。
- 仓库 Skill：在 [`assets/skills.json`](assets/skills.json) 声明。`repo` 写 GitHub `owner/name` 或任意 git URL；`ref` 可选；`skills` 列出仓库内 Skill 目录，省略时安装仓库内全部 `SKILL.md`。仓库浅克隆到 `~/.harness-swarm/skill-repos/`。
- Skill 名取 `SKILL.md` frontmatter 的 `name`，缺省时取目录名。不同来源重名直接报错。

```bash
hs rules                          # 查看各 harness 的软链状态
hs rules link --dry-run           # 预览
hs rules link --force             # 已有规则文件先移到 <path>.hs-backup-<time>，再建软链
hs rules unlink                   # 只删除 hs 建的软链

hs skills list                    # Skill 清单与各 harness 安装状态（不克隆仓库）
hs skills install                 # 终端内打开多选列表，勾选后安装
hs skills install --skill 'lark-*,grill-me'          # 按名称批量选择，支持 * ? 通配
hs skills install --repo mattpocock/skills --repo local  # 选整个仓库；local 指自建 Skill
hs skills install --all --name claude,codex          # 全部安装到指定 harness
hs skills update                  # 更新 hs 已安装 Skill 所在的仓库，再补齐软链
hs skills uninstall               # 终端内多选要删除的 Skill；只删除 hs 建的软链
hs skills uninstall --skill 'zenmux-*'
```

`install` 和 `uninstall` 不会默认处理全部 Skill：没有 `--skill` / `--repo` / `--all` 时，在终端里打开多选列表；非终端环境直接报错。多选列表的按键：`↑↓` 移动，空格勾选，`Tab` 勾选当前仓库全部，`Ctrl+A` 勾选当前显示的全部，直接输入文字过滤，回车确认，`Esc` 取消。只克隆所选 Skill 所在的仓库。没有 `skills` 列表的仓库在克隆前不知道包含哪些 Skill，列表里显示为一项“(all skills in repo)”。

不传 `--name` 时，只处理配置目录已存在的 harness；显式传 `--name` 时会创建缺失目录。目标位置已有普通文件、目录或其他工具的软链时记为 `conflict`，默认跳过并以非零状态退出；加 `--force` 才先备份再替换。

## Goal、恢复与结果

`goal=true` 时 prompt 只写目标，不重复加 `/goal`。Claude、Kimi、Grok 通过原生 Goal prompt 入口执行；Codex 使用 `thread/goal/set` 等 App Server 协议。Codex 的协议状态和 Kimi 原生 `goal.summary` 状态写入 `goal_status`；Kimi 缺少 complete 事件时不能只凭退出 0 宣告完成。Claude/Grok 需读取原生 verdict、退出码和流式证据，不能把退出 0 或一句“完成了”默认当成目标完成。

真实 Goal 专项中 Codex、Kimi 已确认 complete；Claude 流式调用写入/读回成功但没有公开 Goal met 状态；Grok 已启动原生 Goal 和独立审核，但在 150.399 秒超时前尚未裁决，不能称为完成。详见 [验证记录](docs/design.md#验证记录)。

`persist_session` 仅用于 Codex、Claude、Pi 的原生会话保存。原生 `--resume` / `--continue` 参数恢复的是 harness 会话历史；每次 swarm 调度仍新建 worktree，不自动恢复旧工作目录。Codex 的原生 resume/fork 是子命令，当前不通过 native_args 调度。普通 Codex、Claude 任务默认不保存会话；Pi 默认保存到全局 session store（不再指到 run 私有目录），使 `hs sessions` 能列出并恢复它；Codex Goal 要求持久线程。

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

结果包含 `exit_code`、`timed_out`、`summary`、`argv`、日志路径、diff 路径、worktree、base/head SHA、`notes` 与 `native_session_id`（可为空）。`native_session_id` 在 grok/pi/claude 上通过预生成的 `--session-id` 确定性获取，resume 时为被恢复的会话 id；codex/kimi/qoder/opencode2 目前不抓取（需解析输出流，待后续实现）。CLI 遇到失败 Evidence 返回非零退出状态。[设计与真实冒烟记录](docs/design.md) 说明验证范围。

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
