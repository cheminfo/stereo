import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { assignAtomLabels } from '../atomLabels.ts';
import { parseGaussianLog } from '../parseGaussianLog.ts';

test('assigns per-element ordinal labels in file order', () => {
  const atoms = [
    { atomicNumber: 6, element: 'C', x: 0, y: 0, z: 0, isotropic: 0 },
    { atomicNumber: 6, element: 'C', x: 0, y: 0, z: 0, isotropic: 0 },
    { atomicNumber: 8, element: 'O', x: 0, y: 0, z: 0, isotropic: 0 },
    { atomicNumber: 1, element: 'H', x: 0, y: 0, z: 0, isotropic: 0 },
    { atomicNumber: 8, element: 'O', x: 0, y: 0, z: 0, isotropic: 0 },
  ];
  expect(assignAtomLabels(atoms)).toStrictEqual(['C1', 'C2', 'O1', 'H1', 'O2']);
});

test('reproduces the mol2 labels for the elaeocarpine log', () => {
  const content = readFileSync(
    join(import.meta.dirname, 'data', '1_elaeocarpine_c1.log'),
    'latin1',
  );
  const log = parseGaussianLog('1_elaeocarpine_c1.log', content);
  const labels = assignAtomLabels(log.atoms);

  expect(labels[0]).toBe('C1');
  expect(labels[7]).toBe('O1');
  expect(labels[12]).toBe('N1');
  expect(labels[17]).toBe('O2');
  expect(labels[18]).toBe('C16');
  expect(labels[19]).toBe('H1');
  expect(labels[37]).toBe('H19');
});
