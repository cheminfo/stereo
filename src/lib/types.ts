/** A single atom parsed from a Gaussian GIAO log. */
export interface ParsedAtom {
  /** Atomic number (e.g. `6` for carbon). */
  atomicNumber: number;
  /** Element symbol (e.g. `'C'`). */
  element: string;
  /** Cartesian X coordinate in Ångström (from the last orientation block). */
  x: number;
  /** Cartesian Y coordinate in Ångström. */
  y: number;
  /** Cartesian Z coordinate in Ångström. */
  z: number;
  /** Isotropic magnetic shielding constant σ in ppm (GIAO). */
  isotropic: number;
}

/** The data extracted from one Gaussian log file (one conformer). */
export interface ParsedLog {
  /** Original file name, kept for display and conformer identification. */
  fileName: string;
  /** Stereoisomer number from the leading digits of the file name. */
  stereoisomer: number;
  /** Final SCF energy in Hartree, used for Boltzmann weighting (`null` if absent). */
  scfEnergy: number | null;
  /** Whether the job reached `Normal termination`. */
  normalTermination: boolean;
  /** Atoms in Gaussian/file order; index `i` is stable across conformers. */
  atoms: ParsedAtom[];
}

/** All conformers that share the same stereoisomer number. */
export interface StereoisomerGroup {
  stereoisomer: number;
  conformers: ParsedLog[];
}

/** A conformer together with its Boltzmann population at a given temperature. */
export interface ConformerPopulation {
  fileName: string;
  scfEnergy: number | null;
  /** Energy relative to the lowest conformer, in kcal/mol. */
  relativeEnergyKcal: number;
  /** Boltzmann population (0–1). */
  population: number;
}
