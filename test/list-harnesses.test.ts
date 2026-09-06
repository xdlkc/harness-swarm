import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { listHarnesses } from "../src/list-harnesses.js";
import { HARNESS_NAMES } from "../src/types.js";

describe("listHarnesses", () => {
  it("always reports the four harness names", () => {
    const listed = listHarnesses("/nonexistent-path-for-list");
    assert.deepEqual(
      listed.map((h) => h.name),
      [...HARNESS_NAMES],
    );
  });

  it("fills path and non-empty version when fake binaries are on PATH", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "harness-bins-"));
    const scripts: Record<string, string> = {
      qodercli: "#!/bin/sh\necho qoder-stub-1.0\n",
      kimi: "#!/bin/sh\necho kimi-stub-2.0\n",
      pi: "#!/bin/sh\necho pi-stub-3.0\n",
      grok: "#!/bin/sh\necho grok-stub-4.0\n",
    };
    mkdirSync(dir, { recursive: true });
    for (const [name, body] of Object.entries(scripts)) {
      const p = path.join(dir, name);
      writeFileSync(p, body);
      chmodSync(p, 0o755);
    }
    const listed = listHarnesses(dir);
    assert.equal(listed.length, 4);
    for (const row of listed) {
      assert.equal(row.installed, true);
      assert.ok(row.path && row.path.length > 0, `${row.name} path`);
      assert.ok(row.version && row.version.length > 0, `${row.name} version`);
    }
    assert.match(listed.find((h) => h.name === "qoder")!.version!, /qoder-stub-1.0/);
    assert.match(listed.find((h) => h.name === "kimi")!.version!, /kimi-stub-2.0/);
    assert.match(listed.find((h) => h.name === "pi")!.version!, /pi-stub-3.0/);
    assert.match(listed.find((h) => h.name === "grok")!.version!, /grok-stub-4.0/);
  });

  it("keeps installed true with a non-empty version when the probe prints nothing", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "harness-silent-"));
    mkdirSync(dir, { recursive: true });
    for (const name of ["qodercli", "kimi", "pi", "grok"]) {
      const p = path.join(dir, name);
      writeFileSync(p, "#!/bin/sh\nexit 0\n");
      chmodSync(p, 0o755);
    }
    const listed = listHarnesses(dir);
    for (const row of listed) {
      assert.equal(row.installed, true);
      assert.equal(row.version, "unknown");
    }
  });
});
