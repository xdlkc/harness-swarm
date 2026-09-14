import type { HarnessName } from "./types.js";

// Value arities from the 2026-09-15 task-entrypoint help snapshots in docs/*/reference.md.
// Unknown extension flags use --flag=value so they cannot introduce a positional subcommand.
type Arity = "value" | "optional" | "many";
const VALUE_FLAGS: Record<HarnessName, Record<string, Arity>> = {
  "qoder": {
    "--agents": "value",
    "--allowed-tools": "value",
    "--attachment": "value",
    "--branch": "value",
    "--disallowed-tools": "value",
    "--input-format": "value",
    "--max-output-tokens": "value",
    "--max-turns": "value",
    "--model": "value",
    "-f": "value",
    "--output-format": "value",
    "--path": "value",
    "-p": "value",
    "--print": "value",
    "-r": "value",
    "--resume": "value",
    "-w": "value",
    "--workspace": "value"
  },
  "kimi": {
    "-S": "optional",
    "--session": "optional",
    "-m": "value",
    "--model": "value",
    "-p": "value",
    "--prompt": "value",
    "--output-format": "value",
    "--skills-dir": "value",
    "--agent": "value",
    "--agent-file": "value",
    "--add-dir": "value",
    "--resume": "optional",
    "-r": "optional"
  },
  "pi": {
    "--provider": "value",
    "--model": "value",
    "--api-key": "value",
    "--system-prompt": "value",
    "--append-system-prompt": "value",
    "--mode": "value",
    "--session": "value",
    "--session-id": "value",
    "--fork": "value",
    "--session-dir": "value",
    "--name": "value",
    "-n": "value",
    "--models": "value",
    "--tools": "value",
    "-t": "value",
    "--exclude-tools": "value",
    "-xt": "value",
    "--thinking": "value",
    "--extension": "value",
    "-e": "value",
    "--skill": "value",
    "--prompt-template": "value",
    "--theme": "value",
    "--export": "value",
    "--list-models": "optional",
    "--tui-mode": "value"
  },
  "grok": {
    "--agent": "value",
    "--agents": "value",
    "--allow": "value",
    "--cwd": "value",
    "--debug-file": "value",
    "--deny": "value",
    "--disallowed-tools": "value",
    "--json-schema": "value",
    "--leader-socket": "value",
    "-m": "value",
    "--model": "value",
    "--max-turns": "value",
    "--output-format": "value",
    "-p": "value",
    "--single": "value",
    "--permission-mode": "value",
    "--prompt-file": "value",
    "--prompt-json": "value",
    "-r": "optional",
    "--resume": "optional",
    "--reasoning-effort": "value",
    "--effort": "value",
    "--rules": "value",
    "-s": "value",
    "--session-id": "value",
    "--sandbox": "value",
    "--system-prompt-override": "value",
    "--tools": "value",
    "-w": "optional",
    "--worktree": "optional",
    "--worktree-ref": "value",
    "--compaction-mode": "value",
    "--compaction-detail": "value",
    "--load": "value",
    "--background-wait-timeout": "value",
    "--storage-mode": "value",
    "--client-identifier": "value",
    "--hunk-tracker-mode": "value",
    "--installer": "value",
    "--allowedTools": "value",
    "--disallowedTools": "value",
    "--append-system-prompt": "value",
    "--system-prompt": "value"
  },
  "codex": {
    "-c": "value",
    "--config": "value",
    "--enable": "value",
    "--disable": "value",
    "-i": "many",
    "--image": "many",
    "-m": "value",
    "--model": "value",
    "--local-provider": "value",
    "-p": "value",
    "--profile": "value",
    "-s": "value",
    "--sandbox": "value",
    "-C": "value",
    "--cd": "value",
    "--add-dir": "value",
    "--thread-source": "value",
    "--output-schema": "value",
    "--color": "value",
    "-o": "value",
    "--output-last-message": "value"
  },
  "claude": {
    "--add-dir": "many",
    "--agent": "value",
    "--agents": "value",
    "--allowedTools": "many",
    "--allowed-tools": "many",
    "--append-system-prompt": "value",
    "--betas": "many",
    "-d": "optional",
    "--debug": "optional",
    "--debug-file": "value",
    "--disallowedTools": "many",
    "--disallowed-tools": "many",
    "--effort": "value",
    "--fallback-model": "value",
    "--file": "many",
    "--from-pr": "optional",
    "--input-format": "value",
    "--json-schema": "value",
    "--max-budget-usd": "value",
    "--mcp-config": "many",
    "--model": "value",
    "-n": "value",
    "--name": "value",
    "--output-format": "value",
    "--permission-mode": "value",
    "--plugin-dir": "value",
    "--plugin-url": "value",
    "--prompt-suggestions": "optional",
    "--remote-control": "optional",
    "--remote-control-session-name-prefix": "value",
    "-r": "optional",
    "--resume": "optional",
    "--session-id": "value",
    "--setting-sources": "value",
    "--settings": "value",
    "--system-prompt": "value",
    "--tools": "many",
    "-w": "optional",
    "--worktree": "optional",
    "--max-turns": "value",
    "--task-budget": "value",
    "--thinking": "value",
    "--system-prompt-file": "value",
    "--append-system-prompt-file": "value"
  },
  "dsh": {
    "--profile": "value",
    "--patch": "value"
  },
  "opencode": {
    "--log-level": "value", "--command": "value", "-s": "value", "--session": "value",
    "-m": "value", "--model": "value", "--agent": "value", "-f": "many", "--file": "many",
    "--title": "value", "--attach": "value", "-p": "value", "--password": "value",
    "-u": "value", "--username": "value", "--dir": "value", "--port": "value",
    "--variant": "value", "--format": "value", "--replay-limit": "value"
  }
};

export function validateNativeArgStructure(name: HarnessName, args: string[]): void {
  const flags = VALUE_FLAGS[name];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("-") || arg === "-" || arg === "--") {
      throw new Error(`Unexpected positional native argument: ${arg}; native_args cannot select subcommands`);
    }
    if (arg.includes("=")) continue;
    const attached = !arg.startsWith("--") && arg.length > 2 && flags[arg.slice(0, 2)] === "value";
    if (attached) continue;
    const arity = flags[arg];
    if (arity === "value") {
      if (i + 1 >= args.length || args[i + 1].startsWith("--")) throw new Error(`${arg} requires a native value (use ${arg}=... for flag-like values)`);
      i++;
    } else if (arity === "optional" || arity === "many") {
      let count = 0;
      while (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        i++; count++;
        if (arity === "optional") break;
      }
      if (arity === "many" && count === 0) throw new Error(`${arg} requires at least one native value`);
    }
    // Unknown standalone flags are passed as booleans; free values are rejected
    // on the next iteration. --extension-flag=value remains forward compatible.
  }
}
