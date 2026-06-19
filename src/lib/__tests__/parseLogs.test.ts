import { expect, test } from 'vitest';

import { mergeLogs, parseLogFiles } from '../parseLogs.ts';
import type { ParsedLog } from '../types.ts';

test('collects per-file errors instead of failing the batch', () => {
  const result = parseLogFiles([
    { name: '1_empty.log', content: 'no shielding data here' },
  ]);
  expect(result.logs).toHaveLength(0);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0]).toContain('1_empty.log');
});

test('mergeLogs replaces entries with the same file name', () => {
  const previous: ParsedLog[] = [
    {
      fileName: 'a.log',
      stereoisomer: 1,
      scfEnergy: -1,
      normalTermination: true,
      atoms: [],
    },
  ];
  const incoming: ParsedLog[] = [
    {
      fileName: 'a.log',
      stereoisomer: 1,
      scfEnergy: -2,
      normalTermination: true,
      atoms: [],
    },
    {
      fileName: 'b.log',
      stereoisomer: 2,
      scfEnergy: -3,
      normalTermination: true,
      atoms: [],
    },
  ];
  const merged = mergeLogs(previous, incoming);
  expect(merged).toHaveLength(2);
  expect(merged.find((log) => log.fileName === 'a.log')?.scfEnergy).toBe(-2);
});
