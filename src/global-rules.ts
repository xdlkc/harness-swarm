import { existsSync } from "node:fs";
import path from "node:path";
import { groupTargets, packageRoot, selectHarnesses, type AssetOpts } from "./agent-homes.js";
import { applyLink, inspectLink, removeLink, type LinkPlan } from "./links.js";
import type { HarnessName } from "./types.js";

/**
 * One canonical global rules file ships inside this package (assets/rules/AGENTS.md).
 * Each harness gets a symlink at its user-level rules path (CLAUDE.md for Claude Code, AGENTS.md elsewhere),
 * so editing the canonical file updates every harness at once.
 */
export interface RulesOpts extends AssetOpts {
  names?: HarnessName[];
  force?: boolean;
  dryRun?: boolean;
}

export interface RulesEntry extends LinkPlan {
  harnesses: HarnessName[];
}

export interface RulesReport {
  source: string;
  dry_run: boolean;
  entries: RulesEntry[];
}

export function rulesSource(opts: AssetOpts): string {
  return path.join(packageRoot(opts), "assets", "rules", "AGENTS.md");
}

function ownedRoots(opts: AssetOpts): string[] {
  return [path.dirname(rulesSource(opts))];
}

function report(opts: RulesOpts, plan: (target: string, source: string) => LinkPlan): RulesReport {
  const source = rulesSource(opts);
  if (!existsSync(source)) throw new Error(`global rules file is missing: ${source}`);
  const entries: RulesEntry[] = [];
  for (const [target, harnesses] of groupTargets(selectHarnesses(opts.names, opts), "rules", opts)) {
    entries.push({ harnesses, ...plan(target, source) });
  }
  return { source, dry_run: opts.dryRun ?? false, entries };
}

export function rulesStatus(opts: RulesOpts = {}): RulesReport {
  const owned = ownedRoots(opts);
  return report({ ...opts, dryRun: false }, (target, source) => ({ target, source, state: inspectLink(target, source, owned), action: "none" }));
}

export function linkRules(opts: RulesOpts = {}): RulesReport {
  const linkOpts = { force: opts.force, dryRun: opts.dryRun, owned: ownedRoots(opts) };
  return report(opts, (target, source) => applyLink(target, source, linkOpts));
}

export function unlinkRules(opts: RulesOpts = {}): RulesReport {
  const linkOpts = { dryRun: opts.dryRun, owned: ownedRoots(opts) };
  return report(opts, (target) => removeLink(target, linkOpts));
}
