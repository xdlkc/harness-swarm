#!/usr/bin/env node
import { isHarnessName } from "./types.js";
import { listHarnesses } from "./list-harnesses.js";
import { runHarness } from "./dispatch.js";

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  if (cmd === "list" || cmd === undefined) {
    printJson(listHarnesses());
    return;
  }
  if (cmd === "run") {
    const args = parseFlags(rest);
    const name = args.name;
    const prompt = args.prompt;
    if (!name || !isHarnessName(name)) {
      throw new Error("run requires --name qoder|kimi|pi|grok");
    }
    if (!prompt) {
      throw new Error("run requires --prompt");
    }
    const evidence = await runHarness({
      name,
      prompt,
      executable: args.executable,
      model: args.model,
      maxTurns: args.maxTurns ? Number(args.maxTurns) : undefined,
      timeoutMs: args.timeoutMs ? Number(args.timeoutMs) : undefined,
      repoRoot: args.repo,
    });
    printJson(evidence);
    return;
  }
  throw new Error(`unknown command: ${cmd}`);
}

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[camel(key)] = next;
      i += 1;
    } else {
      out[camel(key)] = "true";
    }
  }
  return out;
}

function camel(key: string): string {
  return key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

main(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
