import { BOLTZMANN_HARTREE_PER_K, HARTREE_TO_KCAL } from './constants.ts';
import type { ConformerPopulation, ParsedLog } from './types.ts';

/**
 * Computes Boltzmann populations from a set of conformer energies.
 * `wᵢ ∝ exp(−(Eᵢ − E_min) / kT)`, normalised to sum to 1. Conformers with a
 * `null` energy receive a population of 0.
 * @param energies - Conformer energies in Hartree (`null` if unavailable).
 * @param temperatureK - Absolute temperature in Kelvin.
 * @returns The populations (0–1) aligned with `energies` by index.
 */
export function boltzmannWeights(
  energies: Array<number | null>,
  temperatureK: number,
): number[] {
  const kT = BOLTZMANN_HARTREE_PER_K * temperatureK;
  let minEnergy = Infinity;
  for (const energy of energies) {
    if (energy !== null && energy < minEnergy) {
      minEnergy = energy;
    }
  }

  const weights = new Array<number>(energies.length).fill(0);
  if (!Number.isFinite(minEnergy)) return weights;

  let sum = 0;
  for (let i = 0; i < energies.length; i++) {
    const energy = energies[i];
    if (energy === null || energy === undefined) continue;
    const weight = Math.exp(-(energy - minEnergy) / kT);
    weights[i] = weight;
    sum += weight;
  }
  if (sum > 0) {
    for (let i = 0; i < weights.length; i++) {
      weights[i] = (weights[i] ?? 0) / sum;
    }
  }
  return weights;
}

/**
 * Boltzmann-averages a per-atom quantity across conformers.
 * @param perConformerValues - One value array per conformer, all the same length.
 * @param weights - Boltzmann populations aligned with `perConformerValues`.
 * @returns The weighted-average value per atom.
 */
export function weightedAverageByAtom(
  perConformerValues: number[][],
  weights: number[],
): number[] {
  const atomCount = perConformerValues[0]?.length ?? 0;
  const averaged = new Array<number>(atomCount).fill(0);
  for (let conformer = 0; conformer < perConformerValues.length; conformer++) {
    const values = perConformerValues[conformer];
    const weight = weights[conformer];
    if (!values || weight === undefined) continue;
    for (let atom = 0; atom < atomCount; atom++) {
      const value = values[atom];
      if (value === undefined) continue;
      averaged[atom] = (averaged[atom] ?? 0) + weight * value;
    }
  }
  return averaged;
}

/**
 * Boltzmann-averages the isotropic shieldings of a stereoisomer's conformers.
 * @param conformers - The conformers (each carries atoms and an SCF energy).
 * @param temperatureK - Absolute temperature in Kelvin.
 * @returns The population-weighted isotropic shielding per atom (ppm).
 */
export function averageShieldings(
  conformers: ParsedLog[],
  temperatureK: number,
): number[] {
  const energies = conformers.map((conformer) => conformer.scfEnergy);
  const weights = boltzmannWeights(energies, temperatureK);
  const perConformerValues = conformers.map((conformer) =>
    conformer.atoms.map((atom) => atom.isotropic),
  );
  return weightedAverageByAtom(perConformerValues, weights);
}

/**
 * Builds the per-conformer population table for display.
 * @param conformers - The conformers of one stereoisomer.
 * @param temperatureK - Absolute temperature in Kelvin.
 * @returns Population entries aligned with `conformers`, including ΔE in kcal/mol.
 */
export function conformerPopulations(
  conformers: ParsedLog[],
  temperatureK: number,
): ConformerPopulation[] {
  const energies = conformers.map((conformer) => conformer.scfEnergy);
  const weights = boltzmannWeights(energies, temperatureK);
  let minEnergy = Infinity;
  for (const energy of energies) {
    if (energy !== null && energy < minEnergy) minEnergy = energy;
  }
  return conformers.map((conformer, index) => ({
    fileName: conformer.fileName,
    scfEnergy: conformer.scfEnergy,
    relativeEnergyKcal:
      conformer.scfEnergy === null || !Number.isFinite(minEnergy)
        ? Number.NaN
        : (conformer.scfEnergy - minEnergy) * HARTREE_TO_KCAL,
    population: weights[index] ?? 0,
  }));
}
