/** Boltzmann constant expressed in Hartree per Kelvin. */
export const BOLTZMANN_HARTREE_PER_K = 3.166811563e-6;

/** Conversion factor from Hartree to kcal/mol. */
export const HARTREE_TO_KCAL = 627.5094740631;

/** Default averaging temperature in Kelvin (standard ambient). */
export const DEFAULT_TEMPERATURE_K = 298.15;

/**
 * Covalent radii in Ångström, indexed by atomic number, from
 * Cordero et al., Dalton Trans. 2008, 2832. Used for distance-based bond
 * perception from 3D coordinates. Missing elements fall back to 0.75 Å.
 */
const COVALENT_RADII: Record<number, number> = {
  1: 0.31, // H
  5: 0.84, // B
  6: 0.76, // C
  7: 0.71, // N
  8: 0.66, // O
  9: 0.57, // F
  14: 1.11, // Si
  15: 1.07, // P
  16: 1.05, // S
  17: 1.02, // Cl
  33: 1.21, // As
  34: 1.2, // Se
  35: 1.2, // Br
  53: 1.39, // I
};

const DEFAULT_COVALENT_RADIUS = 0.75;

/**
 * Returns the covalent radius (Å) for an atomic number.
 * @param atomicNumber - The atomic number.
 * @returns The covalent radius in Ångström.
 */
export function covalentRadius(atomicNumber: number): number {
  return COVALENT_RADII[atomicNumber] ?? DEFAULT_COVALENT_RADIUS;
}
