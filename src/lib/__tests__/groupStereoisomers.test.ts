import { expect, test } from 'vitest';

import { groupStereoisomers } from '../groupStereoisomers.ts';
import type { ParsedLog } from '../types.ts';

function makeLog(
  fileName: string,
  stereoisomer: number,
  scfEnergy: number | null,
): ParsedLog {
  return {
    fileName,
    stereoisomer,
    scfEnergy,
    normalTermination: true,
    atoms: [],
  };
}

test('groups by stereoisomer number, sorted ascending', () => {
  const groups = groupStereoisomers([
    makeLog('2_a.log', 2, -10),
    makeLog('1_a.log', 1, -20),
    makeLog('1_b.log', 1, -21),
  ]);
  expect(groups.map((group) => group.stereoisomer)).toStrictEqual([1, 2]);
  expect(groups[0]?.conformers).toHaveLength(2);
  expect(groups[1]?.conformers).toHaveLength(1);
});

test('orders conformers by ascending energy (most stable first)', () => {
  const groups = groupStereoisomers([
    makeLog('1_high.log', 1, -20),
    makeLog('1_low.log', 1, -21),
  ]);
  expect(
    groups[0]?.conformers.map((conformer) => conformer.fileName),
  ).toStrictEqual(['1_low.log', '1_high.log']);
});
