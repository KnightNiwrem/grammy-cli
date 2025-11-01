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

function defaultSink(entry: LogEntry): void {
  const { level, namespace, message, timestamp, metadata } = entry;
  const time = timestamp.toISOString();
  const prefix = `[${namespace}]`;
  const payload = metadata === undefined || Object.keys(metadata).length === 0
    ? message
    : `${message} ${JSON.stringify(metadata)}`;
  const text = `${time} ${prefix} ${payload}`;

  switch (level) {
    case "debug":
      console.debug(text);
      break;
    case "info":
      console.info(text);
      break;
    case "warn":
      console.warn(text);
      break;
    case "error":
      console.error(text);
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
