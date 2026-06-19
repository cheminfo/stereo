import { covalentRadius } from './constants.ts';
import type { ParsedAtom } from './types.ts';

/** A bond perceived from 3D geometry, referencing atoms by their array index. */
export interface PerceivedBond {
  from: number;
  to: number;
  /** Bond order: 1 (single), 2 (double) or 3 (triple). */
  order: number;
}

/** Multiplicative tolerance applied to the sum of covalent radii. */
const BOND_TOLERANCE = 1.25;

/** Typical neutral valence per atomic number, used to cap perceived orders. */
const TYPICAL_VALENCE: Record<number, number> = {
  1: 1, // H
  5: 3, // B
  6: 4, // C
  7: 3, // N
  8: 2, // O
  9: 1, // F
  15: 3, // P
  16: 2, // S
  17: 1, // Cl
  35: 1, // Br
  53: 1, // I
};

/**
 * Perceives connectivity (and approximate bond orders) from 3D coordinates.
 *
 * Two atoms are bonded when their distance is below the sum of their covalent
 * radii scaled by {@link BOND_TOLERANCE}. Multiple bonds are then assigned from
 * a bond-length heuristic, but capped by each atom's remaining valence so the
 * result never over-saturates an atom — which naturally yields a Kekulé pattern
 * around aromatic rings.
 * @param atoms - The atoms with 3D coordinates, in a stable order.
 * @returns The perceived bonds, referencing atoms by their input index.
 */
export function perceiveBonds(atoms: ParsedAtom[]): PerceivedBond[] {
  const bonds: PerceivedBond[] = [];
  const distances: number[] = [];
  const degree = new Array<number>(atoms.length).fill(0);

  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    if (!a) continue;
    const radiusA = covalentRadius(a.atomicNumber);
    for (let j = i + 1; j < atoms.length; j++) {
      const b = atoms[j];
      if (!b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      const distance = Math.hypot(dx, dy, dz);
      const maxDistance =
        (radiusA + covalentRadius(b.atomicNumber)) * BOND_TOLERANCE;
      if (distance > 0.4 && distance <= maxDistance) {
        bonds.push({ from: i, to: j, order: 1 });
        distances.push(distance);
        degree[i] = (degree[i] ?? 0) + 1;
        degree[j] = (degree[j] ?? 0) + 1;
      }
    }
  }

  assignMultipleBonds(atoms, bonds, distances, degree);
  return bonds;
}

function assignMultipleBonds(
  atoms: ParsedAtom[],
  bonds: PerceivedBond[],
  distances: number[],
  degree: number[],
): void {
  const capacity = new Array<number>(atoms.length).fill(0);
  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i];
    if (!atom) continue;
    const valence = TYPICAL_VALENCE[atom.atomicNumber] ?? 0;
    capacity[i] = Math.max(0, valence - (degree[i] ?? 0));
  }

  // Shortest bonds first: they are the most confident multiple bonds.
  const order = bonds.map((_, index) => index);
  order.sort((a, b) => (distances[a] ?? 0) - (distances[b] ?? 0));

  for (const index of order) {
    const bond = bonds[index];
    const distance = distances[index];
    if (!bond || distance === undefined) continue;
    const wanted = wantedExtraOrder(atoms, bond, distance);
    if (wanted === 0) continue;
    const extra = Math.min(
      wanted,
      capacity[bond.from] ?? 0,
      capacity[bond.to] ?? 0,
    );
    if (extra <= 0) continue;
    bond.order = 1 + extra;
    capacity[bond.from] = (capacity[bond.from] ?? 0) - extra;
    capacity[bond.to] = (capacity[bond.to] ?? 0) - extra;
  }
}

function wantedExtraOrder(
  atoms: ParsedAtom[],
  bond: PerceivedBond,
  distance: number,
): number {
  const z1 = atoms[bond.from]?.atomicNumber ?? 0;
  const z2 = atoms[bond.to]?.atomicNumber ?? 0;
  const key = z1 <= z2 ? `${z1}-${z2}` : `${z2}-${z1}`;
  switch (key) {
    case '6-6':
      return distance < 1.25 ? 2 : distance < 1.42 ? 1 : 0;
    case '6-7':
      return distance < 1.21 ? 2 : distance < 1.38 ? 1 : 0;
    case '6-8':
      return distance < 1.32 ? 1 : 0;
    case '7-7':
      return distance < 1.2 ? 2 : distance < 1.3 ? 1 : 0;
    case '7-8':
      return distance < 1.25 ? 1 : 0;
    default:
      return 0;
  }
}
