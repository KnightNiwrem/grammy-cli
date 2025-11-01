export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly namespace: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

export type LogSink = (entry: LogEntry) => void;

export interface Logger {
  readonly level: LogLevel;
  readonly namespace: string;
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  child(suffix: string): Logger;
}

const levelWeights: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(current: LogLevel, candidate: LogLevel): boolean {
  return levelWeights[candidate] >= levelWeights[current];
}

interface ConsoleLike {
  readonly debug?: (...args: unknown[]) => void;
  readonly info?: (...args: unknown[]) => void;
  readonly warn?: (...args: unknown[]) => void;
  readonly error?: (...args: unknown[]) => void;
  readonly log?: (...args: unknown[]) => void;
}

interface TextEncoderConstructor {
  new (): {
    encode(input: string): Uint8Array;
  };
}

function encodeText(text: string): Uint8Array {
  const ctor = (globalThis as { TextEncoder?: TextEncoderConstructor }).TextEncoder;
  if (typeof ctor === "function") {
    return new ctor().encode(`${text}\n`);
  }

  const output = new Uint8Array(text.length + 1);
  for (let index = 0; index < text.length; index += 1) {
    output[index] = text.charCodeAt(index) & 0xff;
  }
  output[output.length - 1] = 0x0a;
  return output;
}

function writeFallback(text: string): void {
  const data = encodeText(text);
  try {
    Deno.stdout.writeSync(data);
  } catch {
    // ignore fallback errors to avoid crashes while logging
  }
}

function defaultSink(entry: LogEntry): void {
  const { level, namespace, message, timestamp, metadata } = entry;
  const time = timestamp.toISOString();
  const prefix = `[${namespace}]`;
  const payload = metadata === undefined || Object.keys(metadata).length === 0
    ? message
    : `${message} ${JSON.stringify(metadata)}`;
  const text = `${time} ${prefix} ${payload}`;

  const consoleLike = (globalThis as { console?: ConsoleLike }).console;
  const logger = consoleLike ?? {};

  switch (level) {
    case "debug":
      if (typeof logger.debug === "function") {
        logger.debug(text);
      } else if (typeof logger.log === "function") {
        logger.log(text);
      } else {
        writeFallback(text);
      }
      break;
    case "info":
      if (typeof logger.info === "function") {
        logger.info(text);
      } else if (typeof logger.log === "function") {
        logger.log(text);
      } else {
        writeFallback(text);
      }
      break;
    case "warn":
      if (typeof logger.warn === "function") {
        logger.warn(text);
      } else {
        writeFallback(text);
      }
      break;
    case "error":
      if (typeof logger.error === "function") {
        logger.error(text);
      } else {
        writeFallback(text);
      }
      break;
  }
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly namespace?: string;
  readonly sink?: LogSink;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const baseLevel = options.level ?? "info";
  const namespace = options.namespace ?? "grammy-cli";
  const sink = options.sink ?? defaultSink;

  const emit = (
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void => {
    if (!shouldLog(baseLevel, level)) {
      return;
    }

    sink({
      level,
      message,
      namespace,
      metadata,
      timestamp: new Date(),
    });
  };

  const bind = (name: string): Logger => {
    return createLogger({
      level: baseLevel,
      namespace: name,
      sink,
    });
  };

  return {
    level: baseLevel,
    namespace,
    debug: (message, metadata) => emit("debug", message, metadata),
    info: (message, metadata) => emit("info", message, metadata),
    warn: (message, metadata) => emit("warn", message, metadata),
    error: (message, metadata) => emit("error", message, metadata),
    child: (suffix) => bind(`${namespace}:${suffix}`),
  };
}

export function selectLogLevel(
  env: Pick<typeof Deno.env, "get"> | undefined = typeof Deno === "undefined"
    ? undefined
    : Deno.env,
): LogLevel {
  let value: string | undefined;
  try {
    value = env?.get("GRAMMY_CLI_LOG_LEVEL")?.toLowerCase();
  } catch {
    value = undefined;
  }
  if (!value) {
    return "info";
  }

  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}
