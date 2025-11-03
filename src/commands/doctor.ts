import { Logger } from "../utils/index.ts";
import { detectRuntime } from "../utils/index.ts";

export interface DoctorCommandOptions {
  readonly logger: Logger;
}

export interface Check {
  readonly name: string;
  readonly status: "pass" | "fail" | "warn";
  readonly message: string;
}

interface TextDecoderConstructor {
  new (): {
    decode(input: Uint8Array): string;
  };
}

interface ConsoleLike {
  readonly log?: (...args: unknown[]) => void;
}

function decodeText(data: Uint8Array): string {
  const ctor = (globalThis as { TextDecoder?: TextDecoderConstructor }).TextDecoder;
  if (typeof ctor === "function") {
    return new ctor().decode(data);
  }

  let result = "";
  for (const byte of data) {
    result += String.fromCharCode(byte);
  }
  return result;
}

function writeLine(logger: Logger, message = ""): void {
  const consoleLike = (globalThis as { console?: ConsoleLike }).console;
  if (typeof consoleLike?.log === "function") {
    consoleLike.log(message);
  } else {
    logger.info(message);
  }
}

function checkDenoVersion(): Check {
  try {
    if (typeof Deno === "undefined" || !Deno.version?.deno) {
      return {
        name: "Deno",
        status: "warn",
        message: "Deno not detected",
      };
    }

    const version = Deno.version.deno;
    const parts = version.split(".").map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;

    const isValid = major > 1 || (major === 1 && minor >= 46);

    return {
      name: "Deno",
      status: isValid ? "pass" : "fail",
      message: `v${version}${isValid ? "" : " (requires ≥1.46)"}`,
    };
  } catch {
    return {
      name: "Deno",
      status: "fail",
      message: "Error checking Deno version",
    };
  }
}

async function checkNodeVersion(): Promise<Check> {
  try {
    const process = new Deno.Command("node", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await process.output();
    if (!output.success) {
      return {
        name: "Node.js",
        status: "warn",
        message: "Node.js not detected",
      };
    }

    const version = decodeText(output.stdout).trim().replace(/^v/, "");
    const parts = version.split(".").map(Number);
    const major = parts[0] ?? 0;

    const isValid = major >= 18;

    return {
      name: "Node.js",
      status: isValid ? "pass" : "fail",
      message: `v${version}${isValid ? "" : " (requires ≥18)"}`,
    };
  } catch {
    return {
      name: "Node.js",
      status: "warn",
      message: "Node.js not detected",
    };
  }
}

async function checkBunVersion(): Promise<Check> {
  try {
    const process = new Deno.Command("bun", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await process.output();
    if (!output.success) {
      return {
        name: "Bun",
        status: "warn",
        message: "Bun not detected",
      };
    }

    const version = decodeText(output.stdout).trim();
    const parts = version.split(".").map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;

    const isValid = major > 1 || (major === 1 && minor >= 1);

    return {
      name: "Bun",
      status: isValid ? "pass" : "fail",
      message: `v${version}${isValid ? "" : " (requires ≥1.1)"}`,
    };
  } catch {
    return {
      name: "Bun",
      status: "warn",
      message: "Bun not detected",
    };
  }
}

interface DenoConfig {
  readonly imports?: Record<string, string>;
}

interface DenoLock {
  readonly npm?: Record<string, unknown>;
  readonly jsr?: Record<string, unknown>;
}

function readJsonFile<T>(path: string): T | undefined {
  try {
    const text = Deno.readTextFileSync(path);
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

export function checkImportCompatibility(): Check {
  const configs: Array<{ path: string; config?: DenoConfig }> = [
    { path: "deno.json", config: readJsonFile<DenoConfig>("deno.json") },
    { path: "deno.jsonc", config: readJsonFile<DenoConfig>("deno.jsonc") },
  ];

  const configEntry = configs.find((entry) => entry.config !== undefined);
  const config = configEntry?.config;

  if (!config) {
    return {
      name: "JSR/npm Imports",
      status: "warn",
      message: "No deno.json or deno.jsonc found",
    };
  }

  const specifiers = Object.values(config.imports ?? {});
  const hasNpm = specifiers.some((value) => value.startsWith("npm:"));
  const hasJsr = specifiers.some((value) => value.startsWith("jsr:"));

  if (!hasNpm && !hasJsr) {
    return {
      name: "JSR/npm Imports",
      status: "warn",
      message: "No npm: or jsr: specifiers configured",
    };
  }

  const lock = readJsonFile<DenoLock>("deno.lock");
  const lockHasNpm = Boolean(lock?.npm && Object.keys(lock.npm).length > 0);
  const lockHasJsr = Boolean(lock?.jsr && Object.keys(lock.jsr).length > 0);

  const issues: string[] = [];
  if (hasNpm && !lockHasNpm) {
    issues.push("lockfile missing npm dependencies");
  }
  if (hasJsr && !lockHasJsr) {
    issues.push("lockfile missing jsr dependencies");
  }

  if (issues.length > 0) {
    return {
      name: "JSR/npm Imports",
      status: "warn",
      message: issues.join("; "),
    };
  }

  const modes = [hasJsr ? "JSR" : undefined, hasNpm ? "npm" : undefined]
    .filter(Boolean)
    .join(" & ");

  return {
    name: "JSR/npm Imports",
    status: "pass",
    message: `${modes} ready`,
  };
}

function checkProjectConfig(): Check {
  try {
    const configs: string[] = [];

    const paths: readonly string[] = [
      "deno.json",
      "deno.jsonc",
      "package.json",
    ];

    for (const path of paths) {
      try {
        Deno.statSync(path);
        configs.push(path);
      } catch {
        // ignore missing files
      }
    }

    if (configs.length > 0) {
      return {
        name: "Project Config",
        status: "pass",
        message: configs.join(", "),
      };
    }

    return {
      name: "Project Config",
      status: "warn",
      message: "No deno.json or package.json found in current directory",
    };
  } catch {
    return {
      name: "Project Config",
      status: "warn",
      message: "Error checking project config",
    };
  }
}

function formatCheck(check: Check): string {
  let symbol: string;
  let color: string;

  switch (check.status) {
    case "pass":
      symbol = "✓";
      color = "\x1b[32m";
      break;
    case "fail":
      symbol = "✗";
      color = "\x1b[31m";
      break;
    case "warn":
      symbol = "-";
      color = "\x1b[33m";
      break;
  }

  const reset = "\x1b[0m";
  return `${color}${symbol}${reset} ${check.name}: ${check.message}`;
}

export async function doctorCommand(options: DoctorCommandOptions): Promise<void> {
  const { logger } = options;

  logger.debug("Running environment checks");
  writeLine(logger, "Environment Diagnostics:\n");

  const runtime = detectRuntime();
  logger.debug(`Detected runtime: ${runtime}`);

  const checks: Check[] = [
    checkDenoVersion(),
    await checkNodeVersion(),
    await checkBunVersion(),
    checkProjectConfig(),
    checkImportCompatibility(),
  ];

  for (const check of checks) {
    writeLine(logger, formatCheck(check));
  }

  const hasCriticalFailure = checks.some((c) => c.status === "fail");

  writeLine(logger);
  if (hasCriticalFailure) {
    writeLine(logger, "\x1b[31m✗ Critical checks failed\x1b[0m");
    Deno.exit(1);
  } else {
    writeLine(logger, "\x1b[32m✓ All critical checks passed\x1b[0m");
  }
}
