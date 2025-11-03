import { Logger } from "../utils/index.ts";
import { detectRuntime } from "../utils/index.ts";

export interface DoctorCommandOptions {
  readonly logger: Logger;
}

interface Check {
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
      status: isValid ? "pass" : "warn",
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
      status: isValid ? "pass" : "warn",
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

function checkProjectConfig(): Check {
  try {
    const hasDeno = (() => {
      try {
        Deno.statSync("deno.json");
        return true;
      } catch {
        try {
          Deno.statSync("deno.jsonc");
          return true;
        } catch {
          return false;
        }
      }
    })();

    const hasPackageJson = (() => {
      try {
        Deno.statSync("package.json");
        return true;
      } catch {
        return false;
      }
    })();

    if (hasDeno || hasPackageJson) {
      const configs = [];
      if (hasDeno) configs.push("deno.json");
      if (hasPackageJson) configs.push("package.json");
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
