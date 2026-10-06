import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { groupTargets, homeDir, packageRoot, selectHarnesses, type AssetOpts } from "./agent-homes.js";
import { applyLink, inspectLink, isOwnedLink, linkTarget, removeLink, type LinkAction, type LinkPlan, type LinkState } from "./links.js";
import type { PickerItem } from "./picker.js";
import type { HarnessName } from "./types.js";

/**
 * Built-in skill list: skills bundled in assets/skills/ plus skills from the git repos declared in
 * assets/skills.json. Nothing is installed by default: callers select skills by name/glob, repo, or path.
 * Only repos behind the selection are shallow-cloned into ~/.harness-swarm/skill-repos/, and every
 * selected skill directory is symlinked into each harness's user-level skills directory.
 */
export interface SkillRepoSpec {
  /** `owner/name` on GitHub, or any git URL. */
  repo: string;
  ref?: string;
  /** Skill directories relative to the repo root; omit to install every SKILL.md found in the repo. */
  skills?: string[];
}

export interface SkillManifest {
  repos: SkillRepoSpec[];
}

export interface SkillEntry {
  name: string;
  /** `local` or the repo spec it came from. */
  origin: string;
  path: string;
}

export interface SkillSelection {
  all?: boolean;
  /** Skill names; `*` and `?` act as wildcards. */
  skills?: string[];
  /** Repo specs from the manifest, or `local` for bundled skills. */
  repos?: string[];
  /** Absolute skill directories, as returned by the interactive picker. */
  paths?: string[];
}

export interface SkillsOpts extends AssetOpts, SkillSelection {
  names?: HarnessName[];
  force?: boolean;
  dryRun?: boolean;
}

export type RepoAction = "cached" | "missing" | "clone" | "update" | "error";

export interface RepoResult {
  repo: string;
  dir: string;
  action: RepoAction;
  error?: string;
}

export interface SkillLink extends LinkPlan {
  skill: string;
  harnesses: HarnessName[];
}

export const LOCAL_ORIGIN = "local";
const SKILL_NAME = /^[A-Za-z0-9][\w.-]*$/;
const GIT_TIMEOUT_MS = 300_000;

export function manifestPath(opts: AssetOpts): string {
  return path.join(packageRoot(opts), "assets", "skills.json");
}

export function localSkillsDir(opts: AssetOpts): string {
  return path.join(packageRoot(opts), "assets", "skills");
}

export function repoCacheDir(opts: AssetOpts): string {
  return path.join(homeDir(opts), ".harness-swarm", "skill-repos");
}

function ownedRoots(opts: AssetOpts): string[] {
  return [localSkillsDir(opts), repoCacheDir(opts)];
}

export function repoUrl(repo: string): string {
  return /^[\w.-]+\/[\w.-]+$/.test(repo) ? `https://github.com/${repo}.git` : repo;
}

export function repoSlug(repo: string): string {
  return repo.replace(/^[a-z+]+:\/\//, "").replace(/\.git$/, "").replace(/[^\w.-]+/g, "__").replace(/^_+/, "");
}

export function loadManifest(opts: AssetOpts): SkillManifest {
  const file = manifestPath(opts);
  if (!existsSync(file)) return { repos: [] };
  const raw = JSON.parse(readFileSync(file, "utf8")) as { repos?: unknown };
  if (!Array.isArray(raw.repos)) throw new Error(`${file}: repos must be an array`);
  const repos = raw.repos.map((item: unknown, index): SkillRepoSpec => {
    const spec = item as Partial<SkillRepoSpec>;
    const where = `${file}: repos[${index}]`;
    if (typeof spec.repo !== "string" || spec.repo.trim() === "") throw new Error(`${where}.repo must be a non-empty string`);
    if (spec.repo === LOCAL_ORIGIN) throw new Error(`${where}.repo cannot be "${LOCAL_ORIGIN}"`);
    if (spec.ref !== undefined && typeof spec.ref !== "string") throw new Error(`${where}.ref must be a string`);
    if (spec.skills !== undefined) {
      if (!Array.isArray(spec.skills) || spec.skills.some((s) => typeof s !== "string")) throw new Error(`${where}.skills must be an array of strings`);
      for (const rel of spec.skills) {
        const normalized = path.posix.normalize(rel);
        if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../")) {
          throw new Error(`${where}.skills entry must stay inside the repo: ${rel}`);
        }
      }
    }
    return { repo: spec.repo, ref: spec.ref, skills: spec.skills };
  });
  return { repos };
}

/** Skill name from SKILL.md frontmatter, falling back to the directory name. */
export function skillName(dir: string, fallback: string): string {
  try {
    const text = readFileSync(path.join(dir, "SKILL.md"), "utf8");
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
    const name = front && /^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(front)?.[1];
    if (name) return name;
  } catch {
    // Missing or unreadable SKILL.md: use the fallback; installation reports the bad path.
  }
  return fallback;
}

/** Directories containing SKILL.md, without descending into a skill or into dot/node_modules dirs. */
export function discoverSkillDirs(root: string, depth = 5): string[] {
  if (existsSync(path.join(root, "SKILL.md"))) return [root];
  if (depth === 0) return [];
  let names: string[];
  try {
    names = readdirSync(root);
  } catch {
    return [];
  }
  return names
    .sort()
    .filter((name) => !name.startsWith(".") && name !== "node_modules")
    .map((name) => path.join(root, name))
    .filter((dir) => statSync(dir, { throwIfNoEntry: false })?.isDirectory())
    .flatMap((dir) => discoverSkillDirs(dir, depth - 1));
}

function git(args: string[]): string | undefined {
  const result = spawnSync("git", args, { encoding: "utf8", timeout: GIT_TIMEOUT_MS });
  if (result.error) return result.error.message;
  if (result.status !== 0) return (result.stderr || result.stdout || `git exited ${result.status}`).trim();
  return undefined;
}

function repoDir(spec: SkillRepoSpec, opts: AssetOpts): string {
  return path.join(repoCacheDir(opts), repoSlug(spec.repo));
}

function isCached(spec: SkillRepoSpec, opts: AssetOpts): boolean {
  return existsSync(path.join(repoDir(spec, opts), ".git"));
}

/** `ensure` clones a missing repo; `update` also refreshes a cached one. Dry runs never touch the network. */
export function fetchRepo(spec: SkillRepoSpec, mode: "ensure" | "update", opts: SkillsOpts): RepoResult {
  const dir = repoDir(spec, opts);
  const cached = isCached(spec, opts);
  if (cached && mode === "ensure") return { repo: spec.repo, dir, action: "cached" };
  const action: RepoAction = cached ? "update" : "clone";
  if (opts.dryRun) return { repo: spec.repo, dir, action };
  const error = cached
    ? git(["-C", dir, "fetch", "--depth", "1", "--quiet", "origin", spec.ref ?? "HEAD"]) ?? git(["-C", dir, "reset", "--hard", "--quiet", "FETCH_HEAD"])
    : git(["clone", "--depth", "1", "--quiet", ...(spec.ref ? ["--branch", spec.ref] : []), repoUrl(spec.repo), dir]);
  return error === undefined ? { repo: spec.repo, dir, action } : { repo: spec.repo, dir, action: "error", error };
}

function localEntries(opts: AssetOpts): SkillEntry[] {
  const root = localSkillsDir(opts);
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .sort()
    .map((name) => path.join(root, name))
    .filter((dir) => existsSync(path.join(dir, "SKILL.md")))
    .map((dir) => ({ name: skillName(dir, path.basename(dir)), origin: LOCAL_ORIGIN, path: dir }));
}

/** Uncached repos with an explicit list use directory names; frontmatter names replace them after cloning. */
function repoEntries(spec: SkillRepoSpec, opts: AssetOpts, errors: string[]): SkillEntry[] {
  const dir = repoDir(spec, opts);
  const cached = isCached(spec, opts);
  const tail = repoSlug(spec.repo).split("__").pop() ?? spec.repo;
  if (spec.skills === undefined) {
    if (!cached) return [];
    return discoverSkillDirs(dir).map((skillDir) => ({
      name: skillName(skillDir, skillDir === dir ? tail : path.basename(skillDir)), origin: spec.repo, path: skillDir,
    }));
  }
  const entries: SkillEntry[] = [];
  for (const rel of spec.skills) {
    const skillDir = path.join(dir, rel);
    if (cached && !existsSync(path.join(skillDir, "SKILL.md"))) {
      errors.push(`${spec.repo}: no SKILL.md at ${rel}`);
      continue;
    }
    entries.push({ name: skillName(skillDir, path.posix.normalize(rel) === "." ? tail : path.basename(skillDir)), origin: spec.repo, path: skillDir });
  }
  return entries;
}

interface Scan {
  skills: SkillEntry[];
  /** Repos without an explicit skills list that are not cloned yet, so their skills are unknown. */
  pending: string[];
  errors: string[];
}

function scan(manifest: SkillManifest, opts: AssetOpts): Scan {
  const errors: string[] = [];
  const skills = [...localEntries(opts), ...manifest.repos.flatMap((spec) => repoEntries(spec, opts, errors))];
  const seen = new Map<string, string>();
  for (const skill of skills) {
    if (!SKILL_NAME.test(skill.name)) throw new Error(`invalid skill name "${skill.name}" from ${skill.origin}`);
    const previous = seen.get(skill.name);
    if (previous !== undefined) throw new Error(`duplicate skill name "${skill.name}" from ${previous} and ${skill.origin}`);
    seen.set(skill.name, skill.origin);
  }
  const pending = manifest.repos.filter((spec) => spec.skills === undefined && !isCached(spec, opts)).map((spec) => spec.repo);
  return { skills, pending, errors };
}

function globToRegExp(pattern: string): RegExp {
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${source}$`);
}

export function hasSelection(sel: SkillSelection): boolean {
  return Boolean(sel.all || sel.skills?.length || sel.repos?.length || sel.paths?.length);
}

export function matchesSelection(entry: SkillEntry, sel: SkillSelection): boolean {
  return Boolean(
    sel.all
      || sel.repos?.includes(entry.origin)
      || sel.paths?.includes(entry.path)
      || sel.skills?.some((pattern) => globToRegExp(pattern).test(entry.name)),
  );
}

function unmatchedPatterns(sel: SkillSelection, skills: SkillEntry[]): string[] {
  return (sel.skills ?? []).filter((pattern) => !skills.some((skill) => globToRegExp(pattern).test(skill.name)));
}

function validateRepos(manifest: SkillManifest, repos: string[] | undefined): void {
  const known = new Set([LOCAL_ORIGIN, ...manifest.repos.map((spec) => spec.repo)]);
  const unknown = (repos ?? []).filter((repo) => !known.has(repo));
  if (unknown.length) throw new Error(`unknown skill repo: ${unknown.join(", ")}; repos are ${[...known].join(", ")}`);
}

/** A repo is fetched only when the selection reaches one of its known skills; unmatched names fall back later. */
function repoSelected(spec: SkillRepoSpec, skills: SkillEntry[], sel: SkillSelection): boolean {
  if (sel.all || sel.repos?.includes(spec.repo)) return true;
  return skills.some((skill) => skill.origin === spec.repo && matchesSelection(skill, sel));
}

function installedStates(skill: SkillEntry, targets: Map<string, HarnessName[]>, owned: string[]): Partial<Record<HarnessName, LinkState>> {
  const installed: Partial<Record<HarnessName, LinkState>> = {};
  for (const [dir, names] of targets) {
    const state = inspectLink(path.join(dir, skill.name), skill.path, owned);
    for (const name of names) installed[name] = state;
  }
  return installed;
}

export interface SkillsListReport {
  harnesses: HarnessName[];
  skills: (SkillEntry & { fetched: boolean; installed: Partial<Record<HarnessName, LinkState>> })[];
  pending: string[];
  errors: string[];
}

/** Lists the whole catalog, or only the selected part when a selection is given. Never fetches. */
export function listSkills(opts: SkillsOpts = {}): SkillsListReport {
  const harnesses = selectHarnesses(opts.names, opts);
  const targets = groupTargets(harnesses, "skills", opts);
  const owned = ownedRoots(opts);
  const manifest = loadManifest(opts);
  validateRepos(manifest, opts.repos);
  const { skills, pending, errors } = scan(manifest, opts);
  const chosen = hasSelection(opts) ? skills.filter((skill) => matchesSelection(skill, opts)) : skills;
  return {
    harnesses,
    skills: chosen.map((skill) => ({ ...skill, fetched: existsSync(skill.path), installed: installedStates(skill, targets, owned) })),
    pending: hasSelection(opts) ? pending.filter((repo) => opts.all || opts.repos?.includes(repo)) : pending,
    errors,
  };
}

function stateHint(installed: Partial<Record<HarnessName, LinkState>>, fetched: boolean): string {
  const by = (state: LinkState) => Object.entries(installed).filter(([, s]) => s === state).map(([name]) => name);
  const linked = by("linked");
  const conflict = by("conflict");
  const parts: string[] = [];
  if (linked.length && linked.length === Object.keys(installed).length) parts.push("installed");
  else if (linked.length) parts.push(`installed: ${linked.join(",")}`);
  if (conflict.length) parts.push(`conflict: ${conflict.join(",")}`);
  if (!fetched) parts.push("not fetched");
  return parts.join(" · ");
}

/** Picker items for `skills install`: one per known skill, plus one per repo whose skills are unknown until cloned. */
export function installCandidates(opts: SkillsOpts = {}): PickerItem[] {
  const report = listSkills({ ...opts, all: undefined, skills: undefined, repos: undefined, paths: undefined });
  return [
    ...report.skills.map((skill) => ({ key: `path:${skill.path}`, label: skill.name, group: skill.origin, hint: stateHint(skill.installed, skill.fetched) })),
    ...report.pending.map((repo) => ({ key: `repo:${repo}`, label: "(all skills in repo)", group: repo, hint: "not fetched" })),
  ];
}

/** Turns picker keys (`path:<dir>` / `repo:<spec>`) back into a selection. */
export function selectionFromKeys(keys: string[]): SkillSelection {
  return {
    paths: keys.filter((key) => key.startsWith("path:")).map((key) => key.slice("path:".length)),
    repos: keys.filter((key) => key.startsWith("repo:")).map((key) => key.slice("repo:".length)),
  };
}

export interface SkillsInstallReport {
  dry_run: boolean;
  harnesses: HarnessName[];
  repos: RepoResult[];
  links: SkillLink[];
  summary: Partial<Record<LinkAction, number>>;
  errors: string[];
}

function summarize(links: SkillLink[]): Partial<Record<LinkAction, number>> {
  const summary: Partial<Record<LinkAction, number>> = {};
  for (const link of links) summary[link.action] = (summary[link.action] ?? 0) + 1;
  return summary;
}

/**
 * Installs the selected skills. `update` refreshes the repos behind the selection first;
 * without a selection it updates the skills hs already installed in the selected harnesses.
 */
export function installSkills(opts: SkillsOpts = {}, update = false): SkillsInstallReport {
  const harnesses = selectHarnesses(opts.names, opts);
  const targets = groupTargets(harnesses, "skills", opts);
  const manifest = loadManifest(opts);
  validateRepos(manifest, opts.repos);
  let sel: SkillSelection = opts;
  if (update && !hasSelection(sel)) sel = { paths: [...new Set(ownedLinks(targets, opts, manifest).map((link) => link.path))] };
  else if (!hasSelection(sel)) throw new Error("select skills with --skill, --repo, or --all (or run in a terminal to pick interactively)");

  const repos: RepoResult[] = [];
  const fetchErrors: string[] = [];
  const fetchAll = (specs: SkillRepoSpec[]): void => {
    for (const spec of specs) {
      const result = fetchRepo(spec, update ? "update" : "ensure", opts);
      repos.push(result);
      if (result.action === "error") fetchErrors.push(`${spec.repo}: ${result.error}`);
    }
  };

  let view = scan(manifest, opts);
  fetchAll(manifest.repos.filter((spec) => repoSelected(spec, view.skills, sel)));
  view = scan(manifest, opts);
  // An unmatched name may live in a repo without a skills list, or behind a frontmatter name that
  // differs from its directory name; clone the remaining repos only then.
  if (unmatchedPatterns(sel, view.skills).length && !opts.dryRun) {
    const tried = new Set(repos.map((result) => result.repo));
    const rest = manifest.repos.filter((spec) => !tried.has(spec.repo) && !isCached(spec, opts));
    if (rest.length) {
      fetchAll(rest);
      view = scan(manifest, opts);
    }
  }
  const unmatched = unmatchedPatterns(sel, view.skills);
  if (unmatched.length) throw new Error(`unknown skill: ${unmatched.join(", ")}; run \`hs skills list\``);

  const linkOpts = { force: opts.force, dryRun: opts.dryRun, owned: ownedRoots(opts) };
  const links: SkillLink[] = [];
  for (const skill of view.skills.filter((entry) => matchesSelection(entry, sel))) {
    for (const [dir, names] of targets) {
      links.push({ skill: skill.name, harnesses: names, ...applyLink(path.join(dir, skill.name), skill.path, linkOpts) });
    }
  }
  return { dry_run: opts.dryRun ?? false, harnesses, repos, links, summary: summarize(links), errors: [...fetchErrors, ...view.errors] };
}

interface OwnedLink extends SkillEntry {
  target: string;
  harnesses: HarnessName[];
}

function originOf(dir: string, opts: AssetOpts, manifest: SkillManifest): string {
  const rel = path.relative(repoCacheDir(opts), dir);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return LOCAL_ORIGIN;
  const slug = rel.split(path.sep)[0];
  return manifest.repos.find((spec) => repoSlug(spec.repo) === slug)?.repo ?? slug;
}

/** Skill links this tool owns in the selected harness dirs; foreign entries are ignored. */
function ownedLinks(targets: Map<string, HarnessName[]>, opts: AssetOpts, manifest: SkillManifest): OwnedLink[] {
  const owned = ownedRoots(opts);
  const links: OwnedLink[] = [];
  for (const [dir, harnesses] of targets) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      const target = path.join(dir, name);
      if (!isOwnedLink(target, owned)) continue;
      const skillPath = linkTarget(target) as string;
      links.push({ name, origin: originOf(skillPath, opts, manifest), path: skillPath, target, harnesses });
    }
  }
  return links;
}

/** Picker items for `skills uninstall`: one per installed skill, across all selected harness dirs. */
export function uninstallCandidates(opts: SkillsOpts = {}): PickerItem[] {
  const manifest = loadManifest(opts);
  const targets = groupTargets(selectHarnesses(opts.names, opts), "skills", opts);
  const items = new Map<string, PickerItem & { names: HarnessName[] }>();
  for (const link of ownedLinks(targets, opts, manifest)) {
    const key = `path:${link.path}`;
    const item = items.get(key) ?? { key, label: link.name, group: link.origin, names: [] };
    item.names.push(...link.harnesses);
    items.set(key, item);
  }
  return [...items.values()].map(({ names, ...item }) => ({ ...item, hint: `installed: ${names.join(",")}` }));
}

export interface SkillsUninstallReport {
  dry_run: boolean;
  harnesses: HarnessName[];
  links: SkillLink[];
  summary: Partial<Record<LinkAction, number>>;
}

/** Removes the selected skill links this tool owns; foreign entries stay. */
export function uninstallSkills(opts: SkillsOpts = {}): SkillsUninstallReport {
  if (!hasSelection(opts)) throw new Error("select skills with --skill, --repo, or --all (or run in a terminal to pick interactively)");
  const harnesses = selectHarnesses(opts.names, opts);
  const manifest = loadManifest(opts);
  validateRepos(manifest, opts.repos);
  const owned = ownedRoots(opts);
  const links = ownedLinks(groupTargets(harnesses, "skills", opts), opts, manifest)
    .filter((link) => matchesSelection(link, opts))
    .map((link): SkillLink => ({ skill: link.name, harnesses: link.harnesses, ...removeLink(link.target, { dryRun: opts.dryRun, owned }) }));
  return { dry_run: opts.dryRun ?? false, harnesses, links, summary: summarize(links) };
}
