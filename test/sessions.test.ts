import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  SESSION_CAPABILITIES,
  getSessionAdapter,
  listAllSessions,
  listSessions,
  searchAllSessions,
  searchSessions,
} from "../src/sessions.js";

function makeHome(t: { after(fn: () => void): void }, layout: Record<string, string>): string {
  const home = mkdtempSync(path.join(os.tmpdir(), "harness-sessions-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  for (const [rel, content] of Object.entries(layout)) {
    const full = path.join(home, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return home;
}

function makeExecutable(t: { after(fn: () => void): void }, body: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "harness-sess-exe-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "opencode2");
  writeFileSync(file, body);
  chmodSync(file, 0o755);
  return file;
}

describe("SESSION_CAPABILITIES", () => {
  it("marks dsh and opencode v1 as unsupported, opencode2 as fully supported", () => {
    assert.deepEqual(SESSION_CAPABILITIES.dsh, { list: false, search: false, resume: false, fork: false });
    assert.deepEqual(SESSION_CAPABILITIES.opencode, { list: false, search: false, resume: false, fork: false });
    assert.deepEqual(SESSION_CAPABILITIES.opencode2, { list: true, search: true, resume: true, fork: true });
    assert.equal(getSessionAdapter("dsh"), undefined);
    assert.equal(getSessionAdapter("opencode"), undefined);
    assert.ok(getSessionAdapter("opencode2"));
  });

  it("errors clearly for unsupported harnesses", () => {
    assert.throws(() => listSessions("dsh"), /does not expose session history/);
    assert.throws(() => searchSessions("opencode", "x"), /does not expose session history/);
  });
});

describe("kimi adapter", () => {
  it("reads session_index.jsonl and per-session state.json", (t) => {
    const home = mkdtempSync(path.join(os.tmpdir(), "harness-sessions-"));
    t.after(() => rmSync(home, { recursive: true, force: true }));
    const s1 = path.join(home, ".kimi-code", "sessions", "wd", "s1");
    const s2 = path.join(home, ".kimi-code", "sessions", "wd", "s2");
    mkdirSync(s1, { recursive: true });
    mkdirSync(s2, { recursive: true });
    writeFileSync(path.join(s1, "state.json"), JSON.stringify({ id: "s1", cwd: "/w/k", createdAt: 1000, updatedAt: 2000, title: "T1", lastPrompt: "fix the bug" }));
    writeFileSync(path.join(s2, "state.json"), JSON.stringify({ id: "s2", cwd: "/w/k", createdAt: 3000, updatedAt: 4000, title: "T2", lastPrompt: "deploy", archived: true }));
    writeFileSync(path.join(home, ".kimi-code", "session_index.jsonl"), [
      JSON.stringify({ sessionId: "s1", sessionDir: s1, workDir: "/w/k" }),
      JSON.stringify({ sessionId: "s2", sessionDir: s2, workDir: "/w/k" }),
    ].join("\n") + "\n");
    const listed = listSessions("kimi", { home });
    assert.equal(listed.length, 1);
    assert.deepEqual(listed[0], {
      harness: "kimi", id: "s1", title: "T1", cwd: "/w/k",
      created_at: new Date(1000).toISOString(), updated_at: new Date(2000).toISOString(),
      summary: "fix the bug",
    });
    assert.deepEqual(searchSessions("kimi", "BUG", { home }).map((r) => r.id), ["s1"]);
    assert.deepEqual(searchSessions("kimi", "deploy", { home }), []);
  });
});

describe("codex adapter", () => {
  it("reads the flat session index without touching rollout files", (t) => {
    const home = makeHome(t, {
      ".codex/session_index.jsonl": [
        JSON.stringify({ id: "c1", thread_name: "Refactor auth", updated_at: "2026-01-02T00:00:00Z" }),
        JSON.stringify({ id: "c2", thread_name: "Add tests", updated_at: "2026-01-03T00:00:00Z" }),
      ].join("\n") + "\n",
    });
    const listed = listSessions("codex", { home });
    assert.equal(listed.length, 2);
    assert.equal(listed[0].id, "c2");
    assert.equal(listed[0].title, "Add tests");
    assert.deepEqual(searchSessions("codex", "auth", { home }).map((r) => r.id), ["c1"]);
  });
});

describe("grok adapter", () => {
  it("scans summary.json with id/title/cwd/model", (t) => {
    const home = makeHome(t, {
      ".grok/sessions/%2Fw/01a/summary.json": JSON.stringify({
        info: { id: "01a", cwd: "/w/g" },
        generated_title: "Grok T1", session_summary: "summarized one",
        created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z",
        current_model_id: "grok-4.6", last_turn_summary: "did the thing",
      }),
      ".grok/sessions/%2Fw/01b/summary.json": JSON.stringify({
        info: { id: "01b", cwd: "/w/g" }, session_summary: "summarized two",
        created_at: "2026-01-03T00:00:00Z", updated_at: "2026-01-04T00:00:00Z",
      }),
    });
    const listed = listSessions("grok", { home });
    assert.equal(listed.length, 2);
    assert.equal(listed[0].id, "01b");
    assert.equal(listed[1].title, "Grok T1");
    assert.equal(listed[1].model, "grok-4.6");
    assert.deepEqual(searchSessions("grok", "summarized one", { home }).map((r) => r.id), ["01a"]);
  });
});

describe("pi adapter", () => {
  it("reads the session header line and searches the first user text", (t) => {
    const header = (id: string, ts: string) => JSON.stringify({ type: "session", version: 3, id, timestamp: ts, cwd: "/w/p" });
    const home = makeHome(t, {
      ".pi/agent/sessions/--w--/a_pi-1.jsonl":
        header("pi-1", "2026-01-01T00:00:00.000Z") + "\n" +
        '{"type":"message","message":{"role":"user","content":[{"type":"text","text":"query needle here"}]}}\n',
      ".pi/agent/sessions/--w--/b_pi-2.jsonl":
        header("pi-2", "2026-01-02T00:00:00.000Z") + "\n" +
        '{"type":"message","message":{"role":"user","content":[{"type":"text","text":"unrelated"}]}}\n',
    });
    const listed = listSessions("pi", { home });
    assert.equal(listed.length, 2);
    assert.equal(listed[0].id, "pi-2");
    assert.deepEqual(searchSessions("pi", "needle", { home }).map((r) => r.id), ["pi-1"]);
    assert.deepEqual(searchSessions("pi", "unrelated", { home }).map((r) => r.id), ["pi-2"]);
  });
});

describe("qoder adapter", () => {
  it("reads <uuid>-session.json files", (t) => {
    const home = makeHome(t, {
      ".qoder/projects/--w--/q1-session.json": JSON.stringify({ id: "q1", title: "Q Title", working_dir: "/w/q", created_at: 1000, updated_at: 2000 }),
    });
    const listed = listSessions("qoder", { home });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].title, "Q Title");
    assert.equal(listed[0].cwd, "/w/q");
    assert.deepEqual(searchSessions("qoder", "title", { home }).map((r) => r.id), ["q1"]);
  });
});

describe("claude adapter", () => {
  it("flattens per-project sessions-index.json entries", (t) => {
    const home = makeHome(t, {
      ".claude/projects/--w--/sessions-index.json": JSON.stringify({
        version: 1,
        entries: [
          { sessionId: "cl1", summary: "Claude T1", firstPrompt: "build a CLI", projectPath: "/w/c", created: "2026-01-01T00:00:00Z", modified: "2026-01-02T00:00:00Z" },
        ],
        originalPath: "/w/c",
      }),
    });
    const listed = listSessions("claude", { home });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, "cl1");
    assert.equal(listed[0].title, "Claude T1");
    assert.equal(listed[0].summary, "build a CLI");
    assert.deepEqual(searchSessions("claude", "CLI", { home }).map((r) => r.id), ["cl1"]);
  });
});

describe("opencode2 adapter", () => {
  it("maps the v2.session.list JSON payload", (t) => {
    const exe = makeExecutable(t, `#!/bin/sh\necho '{"data":[{"id":"ses_1","title":"T1","location":{"directory":"/w/o"},"model":{"id":"m1"},"time":{"created":1000,"updated":2000}}]}'\n`);
    const listed = listSessions("opencode2", { executable: exe });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, "ses_1");
    assert.equal(listed[0].title, "T1");
    assert.equal(listed[0].model, "m1");
    assert.equal(listed[0].cwd, "/w/o");
  });

  it("passes the search parameter for native server-side filtering", (t) => {
    const exe = makeExecutable(t, `#!/bin/sh\ncase "$*" in *search=*) echo '{"data":[{"id":"ses_s","title":"Search","location":{"directory":"/w/o"},"time":{"created":3000,"updated":4000}}]}';; *) echo '{"data":[{"id":"ses_1","title":"T1","time":{"created":1000,"updated":2000}}]}';; esac\n`);
    assert.deepEqual(searchSessions("opencode2", "needle", { executable: exe }).map((r) => r.id), ["ses_s"]);
    assert.deepEqual(listSessions("opencode2", { executable: exe }).map((r) => r.id), ["ses_1"]);
  });

  it("returns nothing when the executable is missing", () => {
    assert.deepEqual(listSessions("opencode2", { executable: "/nonexistent/opencode2" }), []);
  });
});

describe("aggregate queries", () => {
  it("merges and sorts records across all supported harnesses", (t) => {
    const home = makeHome(t, {
      ".codex/session_index.jsonl": JSON.stringify({ id: "c1", thread_name: "Codex", updated_at: "2026-01-05T00:00:00Z" }) + "\n",
      ".grok/sessions/%2Fw/01a/summary.json": JSON.stringify({ info: { id: "01a", cwd: "/w/g" }, session_summary: "grok one", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" }),
    });
    const opts = { home, executable: "/nonexistent/opencode2" };
    const all = listAllSessions(opts);
    assert.ok(all.some((r) => r.harness === "codex"));
    assert.ok(all.some((r) => r.harness === "grok"));
    assert.equal(all[0].harness, "codex");
    const hits = searchAllSessions("grok", opts);
    assert.deepEqual(hits.map((r) => r.id), ["01a"]);
  });
});
