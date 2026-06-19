import { parseGaussianLog } from './parseGaussianLog.ts';
import type { ParsedLog } from './types.ts';

/** A raw log file: its name and full text content. */
export interface RawLogFile {
  name: string;
  content: string;
}

/** The outcome of parsing a batch of log files. */
export interface ParseResult {
  logs: ParsedLog[];
  errors: string[];
}

/**
 * Parses a batch of raw log files, collecting per-file errors instead of failing
 * the whole batch.
 * @param files - The raw files (name + text content).
 * @returns The successfully parsed logs and a list of human-readable errors.
 */
export function parseLogFiles(files: RawLogFile[]): ParseResult {
  const logs: ParsedLog[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      logs.push(parseGaussianLog(file.name, file.content));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { logs, errors };
}

/**
 * Merges newly parsed logs into an existing list, replacing any entry that shares
 * a file name so re-dropping a file updates it in place.
 * @param previous - The current logs.
 * @param incoming - The newly parsed logs.
 * @returns The merged list, de-duplicated by file name.
 */
export function mergeLogs(
  previous: ParsedLog[],
  incoming: ParsedLog[],
): ParsedLog[] {
  const byName = new Map<string, ParsedLog>();
  for (const log of previous) byName.set(log.fileName, log);
  for (const log of incoming) byName.set(log.fileName, log);
  return [...byName.values()];
}
