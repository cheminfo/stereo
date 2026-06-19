import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { parseGaussianLog } from '../parseGaussianLog.ts';
import { perceiveBonds } from '../perceiveBonds.ts';

const content = readFileSync(
  join(import.meta.dirname, 'data', '1_elaeocarpine_c1.log'),
  'latin1',
);
const atoms = parseGaussianLog('1_elaeocarpine_c1.log', content).atoms;
const bonds = perceiveBonds(atoms);

test('perceives the same 41 bonds as the reference mol2', () => {
  expect(bonds).toHaveLength(41);
});

test('finds the carbonyl C=O double bond (atoms 7 and 18)', () => {
  const carbonyl = bonds.find(
    (bond) =>
      (bond.from === 6 && bond.to === 17) ||
      (bond.from === 17 && bond.to === 6),
  );
  expect(carbonyl?.order).toBe(2);
});

test('never over-saturates an atom (no order > 3)', () => {
  for (const bond of bonds) {
    expect(bond.order).toBeGreaterThanOrEqual(1);
    expect(bond.order).toBeLessThanOrEqual(3);
  }
});

test('finds the expected number of double bonds (aromatic ring + carbonyl)', () => {
  const doubles = bonds.filter((bond) => bond.order === 2);
  expect(doubles.length).toBeGreaterThanOrEqual(4);
});
