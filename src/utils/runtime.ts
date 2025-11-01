export type Runtime = "deno" | "node" | "bun" | "unknown";

function isDeno(): boolean {
  return typeof Deno !== "undefined" && typeof Deno.version?.deno === "string";
}

function isBun(processLike: unknown): boolean {
  if (typeof processLike !== "object" || processLike === null) {
    return false;
  }

  const versions = (processLike as { versions?: Record<string, unknown> }).versions;
  return Boolean(versions && typeof versions === "object" && "bun" in versions);
}

function isNode(processLike: unknown): boolean {
  if (typeof processLike !== "object" || processLike === null) {
    return false;
  }

  const release = (processLike as { release?: { name?: string } }).release;
  if (release && typeof release === "object" && release?.name === "node") {
    return true;
  }

  const versions = (processLike as { versions?: Record<string, unknown> }).versions;
  return Boolean(versions && typeof versions === "object" && "node" in versions);
}

export function detectRuntime(globals: typeof globalThis = globalThis): Runtime {
  if (isDeno()) {
    return "deno";
  }

  if (isBun((globals as { process?: unknown }).process)) {
    return "bun";
  }

  if (isNode((globals as { process?: unknown }).process)) {
    return "node";
  }

  return "unknown";
}

export function isInteractiveTerminal(): boolean {
  if (!isDeno()) {
    return false;
  }

  try {
    const stdinTerminal = typeof Deno.stdin.isTerminal === "function"
      ? Deno.stdin.isTerminal()
      : false;
    const stdoutTerminal = typeof Deno.stdout.isTerminal === "function"
      ? Deno.stdout.isTerminal()
      : false;
    return stdinTerminal && stdoutTerminal;
  } catch {
    return false;
  }
}
