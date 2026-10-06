import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { which } from "./list-harnesses.js";
import type { HarnessName } from "./types.js";

/**
 * Native session history for each harness, normalized into one record shape.
 * This is read-only metadata: ids, titles, working directories, and timestamps.
 * Transcripts are never loaded in full.
 */
export interface SessionRecord {
  harness: HarnessName;
  id: string;
  title?: string;
  cwd?: string;
  created_at?: string;
  updated_at?: string;
  model?: string;
  summary?: string;
}

export interface SessionCapabilities {
  list: boolean;
  search: boolean;
  resume: boolean;
  fork: boolean;
}

export interface SessionAdapterOpts {
  /** Base directory for file-backed stores (defaults to the user home). */
  home?: string;
  /** Override the opencode2 executable (defaults to PATH, then ~/.opencode/bin). */
  executable?: string;
  limit?: number;
}

export interface SessionAdapter {
  name: HarnessName;
  list(opts: SessionAdapterOpts): SessionRecord[];
  search(query: string, opts: SessionAdapterOpts): SessionRecord[];
}

export const SESSION_CAPABILITIES: Record<HarnessName, SessionCapabilities> = {
  qoder: { list: true, search: true, resume: true, fork: false },
  kimi: { list: true, search: true, resume: true, fork: false },
  pi: { list: true, search: true, resume: true, fork: true },
  grok: { list: true, search: true, resume: true, fork: true },
  codex: { list: true, search: true, resume: true, fork: true },
  claude: { list: true, search: true, resume: true, fork: true },
  dsh: { list: false, search: false, resume: false, fork: false },
  // opencode v1 has no machine-readable list; its history is served by opencode2's API.
  opencode: { list: false, search: false, resume: false, fork: false },
  opencode2: { list: true, search: true, resume: true, fork: true },
};

const DEFAULT_LIMIT = 50;

function homeDir(opts: SessionAdapterOpts): string {
  return opts.home ?? os.homedir();
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function readJsonl<T>(file: string): T[] {
  try {
    const text = readFileSync(file, "utf8");
    const out: T[] = [];
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        out.push(JSON.parse(trimmed) as T);
      } catch {
        // Skip malformed or partial lines.
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Walk up to maxDepth levels below root, returning files accepted by the predicate. */
function findFiles(root: string, accept: (file: string) => boolean, maxDepth: number): string[] {
  const out: string[] = [];
  const walk = (dir: string, depth: number): void => {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile() && accept(full)) {
        out.push(full);
      }
    }
  };
  if (existsSync(root)) walk(root, 0);
  return out;
}

function msToIso(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value === "string" && value.trim() !== "") return value;
  return undefined;
}

function matches(haystacks: (string | undefined)[], query: string): boolean {
  const needle = query.toLowerCase();
  return haystacks.some((h) => h !== undefined && h.toLowerCase().includes(needle));
}

function sortNewestFirst(records: SessionRecord[]): SessionRecord[] {
  return records.sort((a, b) => {
    const at = a.updated_at ?? a.created_at ?? "";
    const bt = b.updated_at ?? b.created_at ?? "";
    return bt.localeCompare(at);
  });
}

/* ------------------------------------------------------------------ kimi */

interface KimiIndexEntry { sessionId: string; sessionDir: string; workDir: string }
interface KimiState {
  id: string; cwd: string; createdAt: number; updatedAt: number;
  title?: string; lastPrompt?: string; archived?: boolean;
}

function kimiRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const index = readJsonl<KimiIndexEntry>(path.join(homeDir(opts), ".kimi-code", "session_index.jsonl"));
  const records: SessionRecord[] = [];
  for (const entry of index) {
    const state = readJson<KimiState>(path.join(entry.sessionDir, "state.json"));
    if (state?.archived) continue;
    records.push({
      harness: "kimi",
      id: state?.id ?? entry.sessionId,
      title: state?.title,
      cwd: state?.cwd ?? entry.workDir,
      created_at: msToIso(state?.createdAt),
      updated_at: msToIso(state?.updatedAt),
      summary: state?.lastPrompt,
    });
  }
  return records;
}

/* ------------------------------------------------------------------ codex */

interface CodexIndexEntry { id: string; thread_name?: string; updated_at?: string }

function codexRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const index = readJsonl<CodexIndexEntry>(path.join(homeDir(opts), ".codex", "session_index.jsonl"));
  return index.map((entry) => ({
    harness: "codex" as const,
    id: entry.id,
    title: entry.thread_name,
    updated_at: entry.updated_at,
  }));
}

/* ------------------------------------------------------------------ grok */

interface GrokSummary {
  info?: { id?: string; cwd?: string };
  session_summary?: string;
  generated_title?: string;
  created_at?: string;
  updated_at?: string;
  current_model_id?: string;
  last_turn_summary?: string;
}

function grokRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const root = path.join(homeDir(opts), ".grok", "sessions");
  const files = findFiles(root, (f) => path.basename(f) === "summary.json", 3);
  const records: SessionRecord[] = [];
  for (const file of files) {
    const s = readJson<GrokSummary>(file);
    if (!s?.info?.id) continue;
    records.push({
      harness: "grok",
      id: s.info.id,
      title: s.generated_title ?? s.session_summary,
      cwd: s.info.cwd,
      created_at: s.created_at,
      updated_at: s.updated_at,
      model: s.current_model_id,
      summary: s.session_summary ?? s.last_turn_summary,
    });
  }
  return records;
}

/* ------------------------------------------------------------------ pi */

interface PiHeader { type?: string; id?: string; timestamp?: string; cwd?: string }

function piFirstLine(file: string): PiHeader | null {
  try {
    const fd = readFileSync(file, "utf8");
    const newline = fd.indexOf("\n");
    const first = (newline < 0 ? fd : fd.slice(0, newline)).trim();
    if (!first) return null;
    const parsed = JSON.parse(first) as PiHeader;
    return parsed?.type === "session" ? parsed : null;
  } catch {
    return null;
  }
}

/** Best-effort first user text, for search only. Bounded read. */
function piFirstUserText(file: string): string | undefined {
  try {
    const text = readFileSync(file, "utf8").slice(0, 256 * 1024);
    const match = text.match(/"role":"user".*?"text":"((?:[^"\\]|\\.)*)"/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

function piRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const root = path.join(homeDir(opts), ".pi", "agent", "sessions");
  const files = findFiles(root, (f) => f.endsWith(".jsonl"), 3);
  const records: SessionRecord[] = [];
  for (const file of files) {
    const header = piFirstLine(file);
    if (!header?.id) continue;
    records.push({
      harness: "pi",
      id: header.id,
      cwd: header.cwd,
      created_at: header.timestamp,
    });
  }
  return records;
}

function piSearchRecords(query: string, opts: SessionAdapterOpts): SessionRecord[] {
  const root = path.join(homeDir(opts), ".pi", "agent", "sessions");
  const files = findFiles(root, (f) => f.endsWith(".jsonl"), 3);
  const out: SessionRecord[] = [];
  for (const file of files) {
    const header = piFirstLine(file);
    if (!header?.id) continue;
    const record: SessionRecord = {
      harness: "pi",
      id: header.id,
      cwd: header.cwd,
      created_at: header.timestamp,
    };
    if (matches([header.cwd], query) || matches([piFirstUserText(file)], query)) {
      out.push(record);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ qoder */

interface QoderSession {
  id: string; title?: string; working_dir?: string;
  created_at?: number; updated_at?: number;
}

function qoderRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const root = path.join(homeDir(opts), ".qoder", "projects");
  const files = findFiles(root, (f) => f.endsWith("-session.json"), 3);
  const records: SessionRecord[] = [];
  for (const file of files) {
    const s = readJson<QoderSession>(file);
    if (!s?.id) continue;
    records.push({
      harness: "qoder",
      id: s.id,
      title: s.title,
      cwd: s.working_dir,
      created_at: msToIso(s.created_at),
      updated_at: msToIso(s.updated_at),
    });
  }
  return records;
}

/* ------------------------------------------------------------------ claude */

interface ClaudeIndex {
  entries?: {
    sessionId: string; summary?: string; firstPrompt?: string;
    projectPath?: string; created?: string; modified?: string;
  }[];
}

function claudeRecords(opts: SessionAdapterOpts): SessionRecord[] {
  const root = path.join(homeDir(opts), ".claude", "projects");
  const files = findFiles(root, (f) => path.basename(f) === "sessions-index.json", 2);
  const records: SessionRecord[] = [];
  for (const file of files) {
    const index = readJson<ClaudeIndex>(file);
    for (const entry of index?.entries ?? []) {
      if (!entry.sessionId) continue;
      records.push({
        harness: "claude",
        id: entry.sessionId,
        title: entry.summary,
        summary: entry.firstPrompt,
        cwd: entry.projectPath,
        created_at: entry.created,
        updated_at: entry.modified,
      });
    }
  }
  return records;
}

/* ------------------------------------------------------------------ opencode2 */

function resolveOpenCode2(executable?: string): string | null {
  if (executable) return executable;
  const fromPath = which("opencode2");
  if (fromPath) return fromPath;
  const known = path.join(os.homedir(), ".opencode", "bin", "opencode2");
  return existsSync(known) ? known : null;
}

interface OpenCode2Session {
  id: string;
  title?: string;
  location?: { directory?: string };
  model?: { id?: string; providerID?: string };
  time?: { created?: number; updated?: number };
}

function opencode2Api(executable: string, params: string[]): OpenCode2Session[] {
  const args = ["api", "v2.session.list", ...params.flatMap((p) => ["--param", p])];
  const result = spawnSync(executable, args, { encoding: "utf8", timeout: 60_000 });
  if (result.status !== 0) return [];
  const text = (result.stdout || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as { data?: OpenCode2Session[] };
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch {
    return [];
  }
}

function opencode2Records(opts: SessionAdapterOpts): SessionRecord[] {
  const executable = resolveOpenCode2(opts.executable);
  if (!executable) return [];
  const limit = opts.limit ?? DEFAULT_LIMIT;
  return opencode2Api(executable, [`limit=${limit}`, "order=desc"]).map((s) => ({
    harness: "opencode2",
    id: s.id,
    title: s.title,
    cwd: s.location?.directory,
    model: s.model?.id,
    created_at: msToIso(s.time?.created),
    updated_at: msToIso(s.time?.updated),
  }));
}

/* ------------------------------------------------------------------ registry */

const ADAPTERS: Record<HarnessName, SessionAdapter> = {
  qoder: {
    name: "qoder",
    list: (opts) => sortNewestFirst(qoderRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(qoderRecords(opts).filter((r) => matches([r.title], query)))
      .slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  kimi: {
    name: "kimi",
    list: (opts) => sortNewestFirst(kimiRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(kimiRecords(opts).filter((r) => matches([r.title, r.summary], query)))
      .slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  pi: {
    name: "pi",
    list: (opts) => sortNewestFirst(piRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(piSearchRecords(query, opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  grok: {
    name: "grok",
    list: (opts) => sortNewestFirst(grokRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(grokRecords(opts).filter((r) => matches([r.title, r.summary], query)))
      .slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  codex: {
    name: "codex",
    list: (opts) => sortNewestFirst(codexRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(codexRecords(opts).filter((r) => matches([r.title], query)))
      .slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  claude: {
    name: "claude",
    list: (opts) => sortNewestFirst(claudeRecords(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => sortNewestFirst(claudeRecords(opts).filter((r) => matches([r.title, r.summary], query)))
      .slice(0, opts.limit ?? DEFAULT_LIMIT),
  },
  dsh: {
    name: "dsh",
    list: () => [],
    search: () => [],
  },
  opencode: {
    name: "opencode",
    list: () => [],
    search: () => [],
  },
  opencode2: {
    name: "opencode2",
    list: (opts) => sortNewestFirst(opencode2Records(opts)).slice(0, opts.limit ?? DEFAULT_LIMIT),
    search: (query, opts) => {
      const executable = resolveOpenCode2(opts.executable);
      if (!executable) return [];
      const limit = opts.limit ?? DEFAULT_LIMIT;
      return opencode2Api(executable, [`search=${query}`, `limit=${limit}`]).map((s) => ({
        harness: "opencode2" as const,
        id: s.id,
        title: s.title,
        cwd: s.location?.directory,
        model: s.model?.id,
        created_at: msToIso(s.time?.created),
        updated_at: msToIso(s.time?.updated),
      }));
    },
  },
};

export function getSessionAdapter(name: HarnessName): SessionAdapter | undefined {
  const caps = SESSION_CAPABILITIES[name];
  return caps.list || caps.search ? ADAPTERS[name] : undefined;
}

export function listSessions(name: HarnessName, opts: SessionAdapterOpts = {}): SessionRecord[] {
  const adapter = getSessionAdapter(name);
  if (!adapter) throw new Error(`${name} does not expose session history`);
  return adapter.list(opts);
}

export function searchSessions(name: HarnessName, query: string, opts: SessionAdapterOpts = {}): SessionRecord[] {
  const adapter = getSessionAdapter(name);
  if (!adapter) throw new Error(`${name} does not expose session history`);
  return adapter.search(query, opts);
}

export function listAllSessions(opts: SessionAdapterOpts = {}): SessionRecord[] {
  const names = (Object.keys(SESSION_CAPABILITIES) as HarnessName[])
    .filter((name) => SESSION_CAPABILITIES[name].list);
  const all = names.flatMap((name) => ADAPTERS[name].list(opts));
  return sortNewestFirst(all).slice(0, opts.limit ?? DEFAULT_LIMIT);
}

export function searchAllSessions(query: string, opts: SessionAdapterOpts = {}): SessionRecord[] {
  const names = (Object.keys(SESSION_CAPABILITIES) as HarnessName[])
    .filter((name) => SESSION_CAPABILITIES[name].search);
  const all = names.flatMap((name) => ADAPTERS[name].search(query, opts));
  return sortNewestFirst(all).slice(0, opts.limit ?? DEFAULT_LIMIT);
}
