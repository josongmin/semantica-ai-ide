/**
 * Lightweight structured logger.
 *
 * Wraps console.* with a consistent prefix so logs are filterable
 * and can be globally silenced in production builds.
 */

/* eslint-disable no-console */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_PREFIX = "[semantica]";

function shouldLog(level: LogLevel): boolean {
  if (level === "debug") {
    return import.meta.env.DEV;
  }
  return true;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug(LOG_PREFIX, ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info(LOG_PREFIX, ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn(LOG_PREFIX, ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error(LOG_PREFIX, ...args);
  },
  log: (...args: unknown[]) => {
    if (shouldLog("info")) console.log(LOG_PREFIX, ...args);
  },
} as const;

/* eslint-enable no-console */
