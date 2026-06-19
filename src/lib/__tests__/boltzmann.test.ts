import { expect, test } from 'vitest';

import {
  averageShieldings,
  boltzmannWeights,
  conformerPopulations,
  weightedAverageByAtom,
} from '../boltzmann.ts';
import type { ParsedLog } from '../types.ts';

function makeLog(scfEnergy: number | null, isotropic: number[]): ParsedLog {
  return {
    fileName: 'x.log',
    stereoisomer: 1,
    scfEnergy,
    normalTermination: true,
    atoms: isotropic.map((value) => ({
      atomicNumber: 6,
      element: 'C',
      x: 0,
      y: 0,
      z: 0,
      isotropic: value,
    })),
  };
}

test('equal energies give equal populations', () => {
  const weights = boltzmannWeights([-811, -811], 298.15);
  expect(weights[0]).toBeCloseTo(0.5, 10);
  expect(weights[1]).toBeCloseTo(0.5, 10);
});

test('lower energy dominates and the populations sum to 1', () => {
  const weights = boltzmannWeights([-811.06422734, -811.06], 298.15);
  expect((weights[0] ?? 0) + (weights[1] ?? 0)).toBeCloseTo(1, 10);
  expect(weights[0] ?? 0).toBeGreaterThan(weights[1] ?? 0);
  expect(weights[1]).toBeCloseTo(0.0112, 3);
});

test('null energies receive zero population', () => {
  const weights = boltzmannWeights([null, -811], 298.15);
  expect(weights[0]).toBe(0);
  expect(weights[1]).toBeCloseTo(1, 10);
});

test('weightedAverageByAtom averages per atom', () => {
  expect(
    weightedAverageByAtom(
      [
        [10, 20],
        [20, 40],
      ],
      [0.5, 0.5],
    ),
  ).toStrictEqual([15, 30]);
});

test('averageShieldings Boltzmann-averages the conformers', () => {
  const conformers = [makeLog(-811, [10, 20]), makeLog(-811, [20, 40])];
  expect(averageShieldings(conformers, 298.15)).toStrictEqual([15, 30]);
});

test('conformerPopulations reports relative energy and population', () => {
  const conformers = [makeLog(-811, [0]), makeLog(-811, [0])];
  const populations = conformerPopulations(conformers, 298.15);
  expect(populations[0]?.relativeEnergyKcal).toBeCloseTo(0, 10);
  expect(populations[0]?.population).toBeCloseTo(0.5, 10);
  expect(populations[1]?.population).toBeCloseTo(0.5, 10);
});
