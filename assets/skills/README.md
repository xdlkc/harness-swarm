# 内置自建 Skill

每个子目录是一个 Skill：`assets/skills/<name>/SKILL.md`。`hs skills install` 把这些目录直接软链到各 harness 的用户级 skills 目录，修改这里即对所有 harness 生效。

Skill 名取 `SKILL.md` frontmatter 的 `name`，缺省时取目录名。名称不能与 `assets/skills.json` 中的仓库 Skill 重名。
