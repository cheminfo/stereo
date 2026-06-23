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

// OpenChemLib draws a custom label prefixed with `]` as a small superscript next
// to the element symbol it renders itself, so we drop the redundant element
// prefix (`C16` → `]16`) to show `C` full size with `16` shrunk as a superscript.
function superscriptLabel(label: string, element: string): string {
  const locant = label.startsWith(element)
    ? label.slice(element.length)
    : label;
  return `]${locant}`;
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
 * Labels are rendered as superscripts beside the element symbol (`C1` shows as
 * `C` with a small superscript `1`) so the depiction stays uncluttered.
 * @param atoms - The representative conformer's atoms.
 * @param labels - Custom atom labels aligned with `atoms` by index (e.g. `C1`).
 * @returns The molecule with 2D coordinates and superscript custom labels set.
 */
export function build2DMolecule(
  atoms: ParsedAtom[],
  labels: string[],
): Molecule {
  const molecule = createMolecule(atoms);
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const atom = atoms[i];
    if (label && atom) {
      molecule.setAtomCustomLabel(i, superscriptLabel(label, atom.element));
    }
  }
  molecule.inventCoordinates({ keepHydrogens: true });
  return molecule;
}

/**
 * Builds a 2D OpenChemLib molecule with invented coordinates and no atom labels,
 * to serve as the editable depiction the user numbers interactively. Atom order
 * is preserved, so atom index `i` matches the shift table, the 3D viewer and the
 * Gaussian-numbered depiction.
 * @param atoms - The representative conformer's atoms.
 * @returns The molecule with 2D coordinates and no custom labels.
 */
export function buildBareMolecule(atoms: ParsedAtom[]): Molecule {
  const molecule = createMolecule(atoms);
  molecule.inventCoordinates({ keepHydrogens: true });
  return molecule;
}
