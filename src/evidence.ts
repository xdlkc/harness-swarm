/** Keep credential-bearing native options out of durable command evidence. */
export function redactArgv(argv: string[]): string[] {
  let redactNext = false;
  return argv.map((arg) => {
    if (redactNext) { redactNext = false; return "[REDACTED]"; }
    if (/["']?[\w.-]*(?:api[-_]?key|token|secret|password|authorization)["']?\s*[:=]/i.test(arg)) {
      const flag = arg.match(/^(--[\w-]+)=/);
      return flag ? `${flag[1]}=[REDACTED]` : "[REDACTED]";
    }
    const equal = arg.indexOf("=");
    const key = equal < 0 ? arg : arg.slice(0, equal);
    if (/api[-_]?key|token|secret|password|authorization/i.test(key)) {
      // Token budget is a public numeric constraint, not a credential.
      if (/budget|tokens|max-output/i.test(key)) return arg;
      if (equal >= 0) return `${key}=[REDACTED]`;
      if (arg.startsWith("-")) redactNext = true;
    }
    return arg;
  });
}

export function kimiGoalStatus(stdout: string): string | undefined {
  for (const line of stdout.trim().split(/\r?\n/).reverse()) {
    try {
      const event = JSON.parse(line);
      if (event?.type === "goal.summary" && typeof event.status === "string") return event.status;
    } catch { /* Non-JSON diagnostic lines may accompany the event stream. */ }
  }
  return undefined;
}
