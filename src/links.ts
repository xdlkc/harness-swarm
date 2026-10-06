import { lstatSync, mkdirSync, readlinkSync, renameSync, symlinkSync, unlinkSync } from "node:fs";
import path from "node:path";

/**
 * Symlink management shared by `hs rules` and `hs skills`.
 * A link is "ours" when it resolves under one of the owned roots; anything else is a conflict
 * that is only replaced with --force, after moving it to a timestamped backup.
 */
export type LinkState = "linked" | "missing" | "stale" | "conflict";
export type LinkAction = "none" | "link" | "relink" | "replace" | "skip" | "unlink";

export interface LinkPlan {
  target: string;
  source: string;
  state: LinkState;
  action: LinkAction;
  backup?: string;
}

export interface LinkOpts {
  force?: boolean;
  dryRun?: boolean;
  /** Roots whose symlinks this tool created and may rewrite or remove. */
  owned: string[];
}

function isUnder(file: string, root: string): boolean {
  const rel = path.relative(root, file);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Absolute path a symlink points to, or undefined when the target is not a symlink. */
export function linkTarget(target: string): string | undefined {
  try {
    if (!lstatSync(target).isSymbolicLink()) return undefined;
  } catch {
    return undefined;
  }
  return path.resolve(path.dirname(target), readlinkSync(target));
}

export function isOwnedLink(target: string, owned: string[]): boolean {
  const resolved = linkTarget(target);
  return resolved !== undefined && owned.some((root) => isUnder(resolved, root));
}

export function inspectLink(target: string, source: string, owned: string[]): LinkState {
  try {
    lstatSync(target);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    throw err;
  }
  const resolved = linkTarget(target);
  if (resolved === undefined) return "conflict";
  if (resolved === source) return "linked";
  return owned.some((root) => isUnder(resolved, root)) ? "stale" : "conflict";
}

function backupPath(target: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*$/, "");
  return `${target}.hs-backup-${stamp}`;
}

export function applyLink(target: string, source: string, opts: LinkOpts): LinkPlan {
  const state = inspectLink(target, source, opts.owned);
  const plan: LinkPlan = { target, source, state, action: "none" };
  if (state === "linked") return plan;
  if (state === "conflict" && !opts.force) return { ...plan, action: "skip" };
  plan.action = state === "missing" ? "link" : state === "stale" ? "relink" : "replace";
  if (plan.action === "replace") plan.backup = backupPath(target);
  if (opts.dryRun) return plan;
  mkdirSync(path.dirname(target), { recursive: true });
  if (plan.action === "relink") unlinkSync(target);
  if (plan.backup) renameSync(target, plan.backup);
  symlinkSync(source, target);
  return plan;
}

/** Removes the link only when this tool owns it; foreign files and links are left alone. */
export function removeLink(target: string, opts: LinkOpts): LinkPlan {
  const resolved = linkTarget(target);
  const source = resolved ?? "";
  if (resolved === undefined || !isOwnedLink(target, opts.owned)) {
    let state: LinkState = "conflict";
    try {
      lstatSync(target);
    } catch {
      state = "missing";
    }
    return { target, source, state, action: "none" };
  }
  if (!opts.dryRun) unlinkSync(target);
  return { target, source, state: "linked", action: "unlink" };
}
