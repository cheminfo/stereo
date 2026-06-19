import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { buildLabelMapping, extractCustomLabels } from '../customLabels.ts';
import type { ParsedAtom } from '../types.ts';

function atom(element: string): ParsedAtom {
  return { atomicNumber: 0, element, x: 0, y: 0, z: 0, isotropic: 0 };
}

test('extractCustomLabels reads labels and strips the `]` locant marker', () => {
  const molecule = Molecule.fromSmiles('CCO');
  molecule.setAtomCustomLabel(0, ']1');
  molecule.setAtomCustomLabel(1, ']2');
  molecule.setAtomCustomLabel(2, '3');

  expect(extractCustomLabels(molecule)).toStrictEqual(
    new Map([
      [0, '1'],
      [1, '2'],
      [2, '3'],
    ]),
  );
});

test('extractCustomLabels skips unlabelled atoms', () => {
  const molecule = Molecule.fromSmiles('CCO');
  molecule.setAtomCustomLabel(1, ']7');

  expect(extractCustomLabels(molecule)).toStrictEqual(new Map([[1, '7']]));
});

test('buildLabelMapping maps Gaussian to custom, ordered numerically', () => {
  const atoms = [atom('C'), atom('C'), atom('O'), atom('H')];
  const gaussianLabels = ['C1', 'C2', 'O1', 'H1'];
  const customLabels = new Map([
    [2, '1'],
    [0, '10'],
    [1, '2'],
  ]);

  expect(buildLabelMapping(atoms, gaussianLabels, customLabels)).toStrictEqual([
    { index: 2, element: 'O', gaussianLabel: 'O1', customLabel: '1' },
    { index: 1, element: 'C', gaussianLabel: 'C2', customLabel: '2' },
    { index: 0, element: 'C', gaussianLabel: 'C1', customLabel: '10' },
  ]);
});

test('buildLabelMapping ignores out-of-range atom indices', () => {
  const atoms = [atom('C'), atom('O')];
  const customLabels = new Map([
    [0, '1'],
    [99, '2'],
  ]);

  expect(buildLabelMapping(atoms, ['C1', 'O1'], customLabels)).toStrictEqual([
    { index: 0, element: 'C', gaussianLabel: 'C1', customLabel: '1' },
  ]);
});

test('buildLabelMapping sorts numeric labels before lettered ones', () => {
  const atoms = [atom('C'), atom('C'), atom('C')];
  const customLabels = new Map([
    [0, 'a'],
    [1, '2'],
    [2, '1'],
  ]);

  expect(
    buildLabelMapping(atoms, ['C1', 'C2', 'C3'], customLabels).map(
      (row) => row.customLabel,
    ),
  ).toStrictEqual(['1', '2', 'a']);
});

test('buildLabelMapping returns an empty array when nothing is labelled', () => {
  expect(buildLabelMapping([atom('C')], ['C1'], new Map())).toStrictEqual([]);
});
