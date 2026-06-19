import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { assignAtomLabels } from '../atomLabels.ts';
import { build2DMolecule, buildMolfile3D } from '../buildMolecule.ts';
import { parseGaussianLog } from '../parseGaussianLog.ts';

const content = readFileSync(
  join(import.meta.dirname, 'data', '1_elaeocarpine_c1.log'),
  'latin1',
);
const atoms = parseGaussianLog('1_elaeocarpine_c1.log', content).atoms;

test('buildMolfile3D returns a V2000 molfile with all 38 atoms', () => {
  const molfile = buildMolfile3D(atoms);
  expect(molfile).toContain('V2000');
  const countsLine = molfile.split('\n', 4)[3];
  expect(countsLine?.trimStart().startsWith('38')).toBe(true);
});

test('build2DMolecule keeps atom order and applies custom labels', () => {
  const labels = assignAtomLabels(atoms);
  const molecule = build2DMolecule(atoms, labels);
  expect(molecule.getAllAtoms()).toBe(38);
  expect(molecule.getAtomCustomLabel(0)).toBe('C1');
  expect(molecule.getAtomCustomLabel(18)).toBe('C16');
  expect(molecule.getAtomCustomLabel(37)).toBe('H19');
});
