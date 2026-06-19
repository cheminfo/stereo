import { Molecule } from 'openchemlib';

import { perceiveBonds } from './perceiveBonds.ts';
import type { ParsedAtom } from './types.ts';

function bondType(order: number): number {
  if (order >= 3) return Molecule.cBondTypeTriple;
  if (order === 2) return Molecule.cBondTypeDouble;
  return Molecule.cBondTypeSingle;
}

function createMolecule(atoms: ParsedAtom[]): Molecule {
  const bonds = perceiveBonds(atoms);
  const molecule = new Molecule(atoms.length, bonds.length);
  for (const atom of atoms) {
    const index = molecule.addAtom(atom.atomicNumber);
    molecule.setAtomX(index, atom.x);
    molecule.setAtomY(index, atom.y);
    molecule.setAtomZ(index, atom.z);
  }
  for (const bond of bonds) {
    molecule.addOrChangeBond(bond.from, bond.to, bondType(bond.order));
  }
  return molecule;
}

/**
 * Builds a V2000 molfile carrying the 3D coordinates of one conformer, perceiving
 * bonds from the geometry. Atom order matches the input, so atom index `i` is the
 * same in the molfile, in Mol*, and in the shift table.
 * @param atoms - The conformer's atoms with 3D coordinates.
 * @returns A 3D molfile suitable for loading into Mol* as the `mol` format.
 */
export function buildMolfile3D(atoms: ParsedAtom[]): string {
  return createMolecule(atoms).toMolfile();
}

/**
 * Builds a 2D OpenChemLib molecule for depiction: bonds are perceived from the
 * 3D geometry, each atom gets a custom label, and 2D coordinates are invented.
 * Atom order is preserved, so atom index `i` matches the shift table and Mol*.
 * @param atoms - The representative conformer's atoms.
 * @param labels - Custom atom labels aligned with `atoms` by index (e.g. `C1`).
 * @returns The molecule with 2D coordinates and custom labels set.
 */
export function build2DMolecule(
  atoms: ParsedAtom[],
  labels: string[],
): Molecule {
  const molecule = createMolecule(atoms);
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label) molecule.setAtomCustomLabel(i, label);
  }
  molecule.inventCoordinates({ keepHydrogens: true });
  return molecule;
}
