import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { parseGaussianLog } from '../parseGaussianLog.ts';

const content = readFileSync(
  join(import.meta.dirname, 'data', '1_elaeocarpine_c1.log'),
  'latin1',
);
const log = parseGaussianLog('1_elaeocarpine_c1.log', content);

test('extracts stereoisomer, termination and SCF energy', () => {
  expect(log.stereoisomer).toBe(1);
  expect(log.normalTermination).toBe(true);
  expect(log.scfEnergy).toBe(-811.06422734);
});

test('extracts all 38 atoms in file order', () => {
  expect(log.atoms).toHaveLength(38);

  const first = log.atoms[0];
  expect(first?.element).toBe('C');
  expect(first?.atomicNumber).toBe(6);
  expect(first?.isotropic).toBe(114.1843);
  // Coordinates come from the last "Standard orientation" block.
  expect(first?.x).toBe(3.044771);
  expect(first?.y).toBe(1.053675);
  expect(first?.z).toBe(0.09435);

  // Atom 8 (index 7) is the ring oxygen O1.
  expect(log.atoms[7]?.element).toBe('O');
  expect(log.atoms[7]?.atomicNumber).toBe(8);
  // Atom 13 (index 12) is the nitrogen.
  expect(log.atoms[12]?.element).toBe('N');
});

test('matches the expected element composition (C16 N O2 H19)', () => {
  const counts = new Map<string, number>();
  for (const atom of log.atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
  }
  expect(counts.get('C')).toBe(16);
  expect(counts.get('N')).toBe(1);
  expect(counts.get('O')).toBe(2);
  expect(counts.get('H')).toBe(19);
});
