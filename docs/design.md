# Harness Swarm 设计与验证

Harness Swarm 将一次明确的编码任务交给一个原生 harness，在独立 Git worktree 执行，返回可审查证据。调用是同步的，每个调用只有一个 harness；runner 不自动合并、创建 PR、切换源仓库分支或在失败后改派其他 harness。

## 接口与执行层

```text
用户 / Codex session
  ├─ CLI：list / run
  └─ Skill + MCP：list_harnesses / run_harness
      ├─ options：字段、类型、数值及正文校验
      ├─ capabilities：能力与原生参数冲突校验
      ├─ command builder：纯 argv / cwd / env 构造
      └─ dispatch：worktree → 执行 → 日志与差异证据
          ├─ 普通任务：原生 CLI 子进程
          └─ Codex Goal：App Server thread/goal 协议
```

分发包含 `.codex-plugin` overlay、Skill、MCP 配置。插件 MCP 的 `cwd: "."` 解析到插件安装目录，使启动器位置稳定；它不是用户工作区。MCP 必须显式收到绝对 `repo_root`。CLI 可以从显式 `--repo`、工作区环境或当前 Git 目录解析目标。

## 统一字段与原生 API

`list_harnesses` 列出全部 8 个注册 harness；字段含 name、binary、installed、path、version、capabilities。缺失的 binary 仍保留在列表。capabilities 只声明 swarm 当前映射，不检查登录、余额、provider 或模型可用性。

`run_harness` 必填 `name`、非空 `prompt`、绝对 `repo_root`。可选字段如下：

| MCP 字段 | CLI flag | 语义 |
| --- | --- | --- |
| `model` | `--model` | 原生模型 ID / alias |
| `effort` | `--effort` | 按 harness 映射推理强度；不是统一的模型取值枚举 |
| `max_turns` | `--max-turns` | 原生轮次上限；只有 qoder/grok/claude 支持，qoder 可为 0 |
| `goal` | `--goal[=true\|false]` | 创建原生 Goal；prompt 只含目标正文 |
| `token_budget` | `--token-budget` | Codex/Grok 的 Goal token 预算，或 Claude 的 task budget |
| `max_budget_usd` | `--max-budget-usd` | Claude 的美元上限 |
| `persist_session` | `--persist-session[=true\|false]` | Codex/Claude/Pi 的原生会话持久化 |
| `native_args` | `--native-args '<JSON array>'` 或 `-- ...` | 原生任务入口选项及对应 argv 值 |
| `timeout_ms` | `--timeout-ms` | 外层 runner 期限，默认 1,200,000 ms |

CLI 另提供 `--executable` 供明确指定可执行文件，测试用它运行替身。未知字段不丢弃、MCP 不做隐式字符串转换；整数限制必须有限且满足正值/安全整数范围，美元预算是有限正数。结构与能力在创建 worktree 前校验。详见 [options.ts](../src/options.ts)、[capabilities.ts](../src/capabilities.ts)。

native_args 不构成任意命令执行 API：它只扩展已选 harness 的任务入口，不接受管理子命令、正文替换、工作目录替换、输出格式替换或重复结构化选项。参数数量由 [native-args.ts](../src/native-args.ts) 按本机任务帮助声明校验。已记录的任务选项按参数数量解析，可写 `--option value`；未记录或扩展选项如果带值，必须写 `--flag=value`，不能用游离正文传值。布尔 flag 后的 `review` 等游离参数会被拒绝（例如 `--strict-config review`），不能借此切换子命令。原生 API 的完整管理命令保留在各 reference，使用者需直接操作原生 CLI；swarm 不提供通用 raw 管理模式。

## Worktree 与证据

1. 校验输入及能力，解析目标 Git 仓库。
2. 分配 run_id 与 `harness/<name>/<run_id>` 分支，在 `<repo>/.harness-swarm/worktrees/<run_id>` 创建 worktree。
3. 在 `<repo>/.harness-swarm/runs/<run_id>/` 写 brief.md；需要原生 Goal 文本的 harness 使用转换后的执行正文。
4. 普通模式按 builder 的 argv/env/cwd 启动 CLI；Codex Goal 改用 App Server 协议执行器。
5. 按 timeout_ms 限制运行，将 stdout/stderr 或协议事件写入 run.log。
6. 收集 base/head SHA、工作区相对 base 的 diff/stat 和退出状态，保存 diff.patch 与 evidence.json。
7. 返回证据，不合并。CLI 对失败退出码或超时返回非零进程状态。

Evidence 字段：`run_id`、`harness`、`worktree`、`branch`、`base_sha`、`head_sha`、`exit_code`、`timed_out`、`summary`、`diff_stat`、`diff_path`、`log_path`、`started_at`、`finished_at`、`argv`、`notes`，以及从 Codex 协议或 Kimi `goal.summary` 读取的可选 `goal_status`。

Evidence 的 `argv` 和日志命令头会脱敏识别到的 credential 键及包含凭据的参数 payload；相应命令参数位置显示 `[REDACTED]`。普通原生 stdout/stderr 仍按原始输出保存，这不是日志全文脱敏。

会话恢复与 worktree 恢复分开。每次调用生成新的 worktree；即使 native_args 带原生 resume/continue，也不会找回旧 run 目录或切回旧分支。持久化开关只控制原生会话保存。Codex 的 exec resume/fork 为子命令，当前 native_args 不承载此路径。

## 各 harness 映射

| Harness | 执行入口 / 关键映射 |
| --- | --- |
| Qoder 0.1.20 | `-w <worktree> -p <prompt> -f json --quiet`；默认 `--yolo`；model、max-turns |
| Kimi 0.41.0 | `-p <prompt> --output-format stream-json`；model 用 `-m`；沿用已有 home/config/auth；Goal 编码为 `/goal <objective>` |
| Pi 0.84.1 | `--mode json -p @brief`；默认信任项目、排除 ask_question；effort→thinking；会话存在本次 run 的 pi-sessions，显式 false 添加 no-session |
| Grok 1.0.13 | `--cwd --prompt-file --output-format json --no-subagents --verbatim`；默认 always-approve；effort→reasoning-effort；Goal 用 streaming-json、不默认禁用 subagents，预算→`/goal … --budget N` |
| Codex 0.154.0 | 普通 `exec --json --cd`；默认 ephemeral；effort→model_reasoning_effort；Goal 走 App Server |
| Claude 2.1.177 | `-p --output-format json`；默认不持久化；effort、max-turns、task-budget、max-budget-usd；Goal 用 stream-json/verbose，编码为 `/goal <objective>` |
| DSH 0.1.1-rc.2 | 固定 headless profile，双 `--`；profile 配置模型/权限，native patch 置于启动器层；最终结果是纯文本 |
| OpenCode 1.18.21 | `run --format json --dir`；默认 auto；model→provider/model，effort→variant |

显式原生权限模式替换对应默认 bypass，而工作目录和输出协议保持 runner 所有。Kimi `-p` 不可叠加 yolo/auto/plan。Codex Goal 的专用线程固定使用 never 审批与 danger-full-access 策略，原生参数只开放 config/enable/disable/strict-config，且不能禁用 goals。

完整映射：[Qoder](qoder/README.md)、[Kimi](kimi/README.md)、[Pi](pi/README.md)、[Grok](grok/README.md)、[Codex](codex/README.md)、[Claude](claude/README.md)、[DSH](dsh/README.md)、[OpenCode](opencode/README.md)。未支持的公共选项立即报错，不再写 notes 后继续忽略。

## Goal 完成语义

Claude、Kimi、Grok 的适配构造原生 Goal prompt。prompt 应是目标而非已有 `/goal` 或 status/pause/resume 等管理动作；Claude/Kimi 目标最长 4000 字符。Kimi 从原生 `goal.summary` 提取 goal_status；没有 complete 事件而进程退出 0 时也判失败。Claude/Grok 保留原生流式 verdict 与退出状态，不从语气或普通成功退出码合成目标完成。

Codex Goal 使用 `codex app-server --enable goals --stdio`，初始化实验协议、创建持久线程、调用 `thread/goal/set` 并跟踪 `thread/goal/updated` 与 turn 生命周期。token_budget 映射 tokenBudget；目标最长 4000 字符。只有协议报告目标 complete 才是确认完成，普通 turn 完成不等价。非完成终态、协议错误、异常关闭和超时按失败处理。

Codex Goal 不能设置 persist_session=false；其 native_args 仅接受配置和 feature 开关，不接受普通 exec flags 或改变传输端点。Goal 不负责应用 diff 或合并代码。

## 验证记录

参考版本与命令帮助采集于 **2026-09-15**。每个 reference 保留原始完整帮助与来源边界；这些快照没有因适配升级而改写。

同次会话中另运行了真实普通任务冒烟（不是 Goal 持续执行测试），结果如下。版本与各 reference 一致；全部调用均没有超时。

| Harness | 普通模型任务结果 | 说明 |
| --- | --- | --- |
| qoder | 未成功 | CLI 报未登录；未代用户完成登录 |
| kimi | 成功 | 移除空 KIMI_CODE_HOME 覆盖、继承已有认证后重试成功 |
| pi | 成功 | 本机默认配置下完成普通任务 |
| grok | 成功 | 本机默认配置下完成普通任务 |
| codex | 成功 | 普通 exec 路径成功；Goal 专项结果见下表 |
| claude | 成功 | 普通 print 路径，不代表预算耗尽/恢复/Goal 组合均验证 |
| dsh | 成功 | 现有 headless profile 下完成普通任务 |
| opencode | 未成功 | Provider 返回 401；未修改用户认证 |

另做了真实 Goal 专项核验，与上表普通任务分开记录：

| Harness | Goal 专项结果 | 证据边界 |
| --- | --- | --- |
| Codex | 确认 complete，约 26.3 秒 | effort=low；thread/goal/set active→complete，等待 turn/completed；精确文件/读回/单行 patch 通过 |
| Kimi | 确认 complete，约 14.992 秒 | Write→Read→UpdateGoal(complete)；原生 goal.summary 的 status=complete、turnsUsed=1 |
| Claude | 流式执行成功，Goal met 未确认 | 54.288 秒，exit 0、无超时；Write→Read 精确文件通过；公开 stream 无 goal-status/met，通用 completed 不能证明 Goal met |
| Grok | 原生 Goal 已启动，未完成 | 流式重试 150.399 秒超时，exit 124；738 条 NDJSON，write→read→独立审核；goal_created/worker_completed，active、phaseExecuting、1 worker round；审核未裁决，无认证错误 |

这些结果只说明当时本机配置下的调用，不承诺任意模型、第三方插件和所有参数组合有效。新增结构化字段、native argv、错误输入、worktree 和证据路径由自动测试验证；真实模型任务不是 CI 的默认测试门槛。`npm test` 构建并运行测试，替身 CLI/协议测试不消耗模型任务预算。

## 调度原则

用户指定的 harness 优先；未指定时 Skill 可按任务选择。binary 缺失或认证失败需报告具体原因，不自动改派。读取实际 diff、日志、退出状态和 Goal 协议证据后再判断任务完成；用户已有授权决定后续合并边界。
