import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { selectHarnesses } from "../src/agent-homes.js";
import { linkRules, rulesStatus, unlinkRules } from "../src/global-rules.js";
import {
  installCandidates, installSkills, listSkills, repoCacheDir, repoSlug, repoUrl, selectionFromKeys, uninstallCandidates, uninstallSkills,
} from "../src/global-skills.js";
import { initialState, reduce, render, visibleItems, type Key, type PickerItem, type PickerState } from "../src/picker.js";

type T = { after(fn: () => void): void };

function tmp(t: T, prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function write(file: string, content: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function skillMd(name: string): string {
  return `---\nname: ${name}\ndescription: test skill\n---\n\nBody\n`;
}

/** Fake package root (assets/) and fake home with the given harness config dirs. */
function setup(t: T, roots: string[]): { home: string; packageRoot: string } {
  const home = tmp(t, "hs-home-");
  const packageRoot = tmp(t, "hs-pkg-");
  for (const root of roots) mkdirSync(path.join(home, root), { recursive: true });
  write(path.join(packageRoot, "assets", "rules", "AGENTS.md"), "# global rules\n");
  return { home, packageRoot };
}

function manifest(env: { packageRoot: string }, repos: unknown[]): void {
  write(path.join(env.packageRoot, "assets", "skills.json"), JSON.stringify({ repos }));
}

function gitRepo(t: T, files: Record<string, string>): string {
  const dir = tmp(t, "hs-repo-");
  for (const [rel, content] of Object.entries(files)) write(path.join(dir, rel), content);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git("init", "--quiet");
  git("add", ".");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "-m", "init");
  return dir;
}

describe("selectHarnesses", () => {
  it("defaults to supported harnesses whose config dir exists", (t) => {
    const env = setup(t, [".claude", ".codex", ".dsh", ".config/opencode"]);
    assert.deepEqual(selectHarnesses(undefined, env), ["codex", "claude", "opencode", "opencode2"]);
  });

  it("rejects dsh when named explicitly", (t) => {
    const env = setup(t, []);
    assert.throws(() => selectHarnesses(["dsh"], env), /dsh has no user-level rules/);
  });
});

describe("global rules", () => {
  it("links CLAUDE.md for claude, AGENTS.md elsewhere, and dedupes shared opencode targets", (t) => {
    const env = setup(t, [".claude", ".grok", ".config/opencode"]);
    const report = linkRules(env);
    const source = path.join(env.packageRoot, "assets", "rules", "AGENTS.md");
    assert.deepEqual(report.entries.map((e) => [path.relative(env.home, e.target), e.harnesses, e.action]), [
      [".grok/AGENTS.md", ["grok"], "link"],
      [".claude/CLAUDE.md", ["claude"], "link"],
      [".config/opencode/AGENTS.md", ["opencode", "opencode2"], "link"],
    ]);
    assert.equal(readlinkSync(path.join(env.home, ".claude", "CLAUDE.md")), source);
    assert.equal(readFileSync(path.join(env.home, ".grok", "AGENTS.md"), "utf8"), "# global rules\n");
    assert.ok(rulesStatus(env).entries.every((e) => e.state === "linked"));
    assert.ok(linkRules(env).entries.every((e) => e.action === "none"));
  });

  it("skips an existing file unless --force, which backs it up first", (t) => {
    const env = setup(t, [".codex"]);
    const target = path.join(env.home, ".codex", "AGENTS.md");
    write(target, "old rules\n");
    assert.equal(linkRules(env).entries[0].action, "skip");
    assert.equal(readFileSync(target, "utf8"), "old rules\n");

    const dry = linkRules({ ...env, force: true, dryRun: true }).entries[0];
    assert.equal(dry.action, "replace");
    assert.ok(!lstatSync(target).isSymbolicLink());

    const forced = linkRules({ ...env, force: true }).entries[0];
    assert.equal(forced.action, "replace");
    assert.ok(lstatSync(target).isSymbolicLink());
    assert.equal(readFileSync(forced.backup!, "utf8"), "old rules\n");
  });

  it("creates config dirs for explicitly named harnesses and unlinks only its own links", (t) => {
    const env = setup(t, [".claude"]);
    write(path.join(env.home, ".claude", "CLAUDE.md"), "keep me\n");
    linkRules({ ...env, names: ["pi"] });
    const piTarget = path.join(env.home, ".pi", "agent", "AGENTS.md");
    assert.ok(lstatSync(piTarget).isSymbolicLink());

    const report = unlinkRules({ ...env, names: ["pi", "claude"] });
    assert.deepEqual(report.entries.map((e) => e.action), ["unlink", "none"]);
    assert.ok(!existsSync(piTarget));
    assert.equal(readFileSync(path.join(env.home, ".claude", "CLAUDE.md"), "utf8"), "keep me\n");
  });
});

describe("global skills", () => {
  it("maps repo specs to URLs and cache slugs", () => {
    assert.equal(repoUrl("anthropics/skills"), "https://github.com/anthropics/skills.git");
    assert.equal(repoUrl("file:///tmp/x"), "file:///tmp/x");
    assert.equal(repoSlug("anthropics/skills"), "anthropics__skills");
    assert.equal(repoSlug("https://example.com/a/b.git"), "example.com__a__b");
  });

  it("installs everything with --all into every selected harness dir, using frontmatter names", (t) => {
    const env = setup(t, [".claude", ".codex"]);
    write(path.join(env.packageRoot, "assets", "skills", "mine", "SKILL.md"), skillMd("my-skill"));
    write(path.join(env.packageRoot, "assets", "skills", "README.md"), "not a skill\n");
    const repo = gitRepo(t, {
      "skills/alpha/SKILL.md": skillMd("alpha"),
      "skills/beta/SKILL.md": skillMd("beta-renamed"),
      "skills/gamma/SKILL.md": skillMd("gamma"),
    });
    manifest(env, [{ repo: `file://${repo}`, skills: ["skills/alpha", "skills/beta"] }]);

    const before = listSkills(env);
    assert.deepEqual(before.skills.map((s) => [s.name, s.fetched]), [["my-skill", true], ["alpha", false], ["beta", false]]);

    const report = installSkills({ ...env, all: true });
    assert.deepEqual(report.errors, []);
    assert.equal(report.repos[0].action, "clone");
    assert.deepEqual(report.summary, { link: 6 });
    for (const root of [".claude", ".codex"]) {
      assert.deepEqual(readdirSync(path.join(env.home, root, "skills")).sort(), ["alpha", "beta-renamed", "my-skill"]);
    }
    assert.equal(readlinkSync(path.join(env.home, ".claude", "skills", "my-skill")), path.join(env.packageRoot, "assets", "skills", "mine"));

    const after = listSkills(env);
    assert.ok(after.skills.every((s) => s.installed.claude === "linked" && s.installed.codex === "linked"));
    assert.deepEqual(installSkills({ ...env, all: true }).summary, { none: 6 });
  });

  it("requires a selection and clones only the repos behind it", (t) => {
    const env = setup(t, [".claude"]);
    const repoA = gitRepo(t, { "lark-doc/SKILL.md": skillMd("lark-doc"), "lark-im/SKILL.md": skillMd("lark-im"), "misc/SKILL.md": skillMd("misc") });
    const repoB = gitRepo(t, { "z/SKILL.md": skillMd("z") });
    manifest(env, [
      { repo: `file://${repoA}`, skills: ["lark-doc", "lark-im", "misc"] },
      { repo: `file://${repoB}`, skills: ["z"] },
    ]);
    assert.throws(() => installSkills(env), /select skills with --skill, --repo, or --all/);

    const report = installSkills({ ...env, skills: ["lark-*"] });
    assert.deepEqual(report.repos.map((r) => [r.repo, r.action]), [[`file://${repoA}`, "clone"]]);
    assert.deepEqual(report.links.map((l) => l.skill), ["lark-doc", "lark-im"]);
    assert.ok(!existsSync(path.join(repoCacheDir(env), repoSlug(`file://${repoB}`))));

    const byRepo = installSkills({ ...env, repos: [`file://${repoB}`] });
    assert.deepEqual(byRepo.links.map((l) => [l.skill, l.action]), [["z", "link"]]);
    assert.throws(() => installSkills({ ...env, repos: ["nobody/nothing"] }), /unknown skill repo: nobody\/nothing/);
  });

  it("selects repos without a skills list by --repo, and falls back to cloning for frontmatter names", (t) => {
    const env = setup(t, [".grok"]);
    const wild = gitRepo(t, { "a/SKILL.md": skillMd("a"), "nested/b/SKILL.md": skillMd("b"), ".hidden/c/SKILL.md": skillMd("c") });
    const renamed = gitRepo(t, { "skills/beta/SKILL.md": skillMd("beta-renamed") });
    manifest(env, [{ repo: `file://${wild}` }, { repo: `file://${renamed}`, skills: ["skills/beta"] }]);
    assert.deepEqual(listSkills(env).pending, [`file://${wild}`]);

    const report = installSkills({ ...env, repos: [`file://${wild}`] });
    assert.deepEqual(report.links.map((l) => l.skill), ["a", "b"]);
    assert.deepEqual(listSkills(env).pending, []);

    const fallback = installSkills({ ...env, skills: ["beta-renamed"] });
    assert.deepEqual(fallback.links.map((l) => [l.skill, l.action]), [["beta-renamed", "link"]]);
    assert.throws(() => installSkills({ ...env, skills: ["nope"] }), /unknown skill: nope/);
  });

  it("builds picker items and installs the picked keys", (t) => {
    const env = setup(t, [".claude", ".codex"]);
    write(path.join(env.packageRoot, "assets", "skills", "mine", "SKILL.md"), skillMd("mine"));
    write(path.join(env.packageRoot, "assets", "skills", "other", "SKILL.md"), skillMd("other"));
    const wild = gitRepo(t, { "w/SKILL.md": skillMd("w") });
    manifest(env, [{ repo: `file://${wild}` }]);
    installSkills({ ...env, names: ["claude"], skills: ["other"] });

    const items = installCandidates(env);
    assert.deepEqual(items.map((i) => [i.label, i.group, i.hint]), [
      ["mine", "local", ""],
      ["other", "local", "installed: claude"],
      ["(all skills in repo)", `file://${wild}`, "not fetched"],
    ]);
    const report = installSkills({ ...env, ...selectionFromKeys([items[0].key, items[2].key]) });
    assert.deepEqual(report.links.map((l) => [l.skill, l.harnesses.join()]), [["mine", "codex"], ["mine", "claude"], ["w", "codex"], ["w", "claude"]]);
  });

  it("update without a selection refreshes only repos behind installed skills", (t) => {
    const env = setup(t, [".claude"]);
    const repoA = gitRepo(t, { "x/SKILL.md": skillMd("x") });
    const repoB = gitRepo(t, { "y/SKILL.md": skillMd("y") });
    manifest(env, [{ repo: `file://${repoA}`, skills: ["x"] }, { repo: `file://${repoB}`, skills: ["y"] }]);
    installSkills({ ...env, skills: ["x"] });
    const report = installSkills(env, true);
    assert.deepEqual(report.repos.map((r) => [r.repo, r.action]), [[`file://${repoA}`, "update"]]);
    assert.deepEqual(report.links.map((l) => [l.skill, l.action]), [["x", "none"]]);
  });

  it("keeps foreign skills, reports repo errors, and uninstalls only selected own links", (t) => {
    const env = setup(t, [".claude"]);
    for (const name of ["mine", "mine-too", "other"]) write(path.join(env.packageRoot, "assets", "skills", name, "SKILL.md"), skillMd(name));
    manifest(env, [{ repo: "file:///nonexistent/hs-repo" }]);
    const foreign = tmp(t, "hs-foreign-");
    mkdirSync(path.join(env.home, ".claude", "skills"), { recursive: true });
    symlinkSync(foreign, path.join(env.home, ".claude", "skills", "other"), "dir");

    const report = installSkills({ ...env, all: true });
    assert.equal(report.repos[0].action, "error");
    assert.equal(report.errors.length, 1);
    assert.deepEqual(report.links.map((l) => [l.skill, l.action]), [["mine", "link"], ["mine-too", "link"], ["other", "skip"]]);

    assert.deepEqual(uninstallCandidates(env).map((i) => i.label), ["mine", "mine-too"]);
    assert.throws(() => uninstallSkills(env), /select skills/);
    assert.deepEqual(uninstallSkills({ ...env, skills: ["mine-*"] }).links.map((l) => [l.skill, l.action]), [["mine-too", "unlink"]]);
    assert.deepEqual(uninstallSkills({ ...env, repos: ["local"] }).links.map((l) => [l.skill, l.action]), [["mine", "unlink"]]);
    assert.deepEqual(readdirSync(path.join(env.home, ".claude", "skills")), ["other"]);
  });

  it("rejects duplicate skill names across sources", (t) => {
    const env = setup(t, [".claude"]);
    write(path.join(env.packageRoot, "assets", "skills", "x", "SKILL.md"), skillMd("dup"));
    write(path.join(env.packageRoot, "assets", "skills", "y", "SKILL.md"), skillMd("dup"));
    assert.throws(() => listSkills(env), /duplicate skill name "dup"/);
  });
});

describe("picker reducer", () => {
  const items: PickerItem[] = [
    { key: "1", label: "lark-doc", group: "larksuite/cli" },
    { key: "2", label: "lark-im", group: "larksuite/cli" },
    { key: "3", label: "grill-me", group: "mattpocock/skills" },
  ];
  const press = (state: PickerState, ...keys: Key[]) => keys.reduce(reduce, state);

  it("moves, toggles one item, a whole group, and everything shown", () => {
    let state = press(initialState(items), { name: "down" }, { name: "space" });
    assert.deepEqual([...state.selected], ["2"]);
    state = press(state, { name: "tab" });
    assert.deepEqual([...state.selected].sort(), ["1", "2"]);
    state = press(state, { name: "tab" });
    assert.deepEqual([...state.selected], []);
    state = press(state, { name: "a", ctrl: true });
    assert.equal(state.selected.size, 3);
    state = press(state, { name: "down" }, { name: "down" }, { name: "down" });
    assert.equal(state.cursor, 2);
  });

  it("filters by typed text, clears on escape, then cancels", () => {
    let state = press(initialState(items), { sequence: "g" }, { sequence: "r" });
    assert.deepEqual(visibleItems(state).map((i) => i.label), ["grill-me"]);
    state = press(state, { name: "a", ctrl: true });
    assert.deepEqual([...state.selected], ["3"]);
    state = press(state, { name: "escape" });
    assert.equal(state.filter, "");
    assert.equal(state.done, undefined);
    assert.equal(press(state, { name: "escape" }).done, "cancel");
    assert.equal(press(state, { name: "return" }).done, "confirm");
    assert.ok(render(state, "Install skills", 10).some((line) => line.includes("[x] grill-me")));
  });
});
