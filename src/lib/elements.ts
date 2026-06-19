// Atomic number ↔ element symbol, covering the first 86 elements. Gaussian
// "Standard orientation" blocks give the atomic number; the shielding lines give
// the symbol. We resolve both to a single source of truth here.

const SYMBOLS = [
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S',
  'Cl',
  'Ar',
  'K',
  'Ca',
  'Sc',
  'Ti',
  'V',
  'Cr',
  'Mn',
  'Fe',
  'Co',
  'Ni',
  'Cu',
  'Zn',
  'Ga',
  'Ge',
  'As',
  'Se',
  'Br',
  'Kr',
  'Rb',
  'Sr',
  'Y',
  'Zr',
  'Nb',
  'Mo',
  'Tc',
  'Ru',
  'Rh',
  'Pd',
  'Ag',
  'Cd',
  'In',
  'Sn',
  'Sb',
  'Te',
  'I',
  'Xe',
  'Cs',
  'Ba',
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm',
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
  'Hf',
  'Ta',
  'W',
  'Re',
  'Os',
  'Ir',
  'Pt',
  'Au',
  'Hg',
  'Tl',
  'Pb',
  'Bi',
  'Po',
  'At',
  'Rn',
];

const SYMBOL_TO_NUMBER = new Map<string, number>(
  SYMBOLS.map((symbol, index) => [symbol, index + 1]),
);

/**
 * Returns the element symbol for an atomic number.
 * @param atomicNumber - The atomic number (1-based).
 * @returns The element symbol, or `'X'` if out of the supported range.
 */
export function symbolFromAtomicNumber(atomicNumber: number): string {
  return SYMBOLS[atomicNumber - 1] ?? 'X';
}

/**
 * Returns the atomic number for an element symbol.
 * @param symbol - The element symbol (case-sensitive, e.g. `'Cl'`).
 * @returns The atomic number, or `0` if the symbol is unknown.
 */
export function atomicNumberFromSymbol(symbol: string): number {
  return SYMBOL_TO_NUMBER.get(symbol) ?? 0;
}
