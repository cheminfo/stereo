import type { Molecule } from 'openchemlib';

import type { ParsedAtom } from './types.ts';

/** One row of the Gaussian → custom atom-label mapping. */
export interface LabelMappingRow {
  /** Atom index, stable across the table, the 2D depictions and the 3D viewer. */
  index: number;
  /** Element symbol. */
  element: string;
  /** Label from the Gaussian / file numbering (e.g. `C3`). */
  gaussianLabel: string;
  /** User-assigned custom label (e.g. `5`). */
  customLabel: string;
}

/**
 * Reads the user-assigned custom labels from an edited molecule, indexed by atom.
 * OpenChemLib stores quick-numbering locants with a leading `]`; it is stripped
 * here so callers see the bare label the user typed.
 * @param molecule - The molecule edited through react-ocl's `SvgEditor`.
 * @returns A map from atom index to its (non-empty) custom label.
 */
export function extractCustomLabels(molecule: Molecule): Map<number, string> {
  const labels = new Map<number, string>();
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    const raw = molecule.getAtomCustomLabel(atom);
    if (!raw) continue;
    const label = raw.replaceAll(']', '');
    if (label) labels.set(atom, label);
  }
  return labels;
}

/**
 * Builds the Gaussian → custom mapping rows for every atom the user has
 * labelled, ordered by the custom label (numeric-aware) so it reads in the
 * user's numbering.
 * @param atoms - The atoms in parsed (Gaussian / file) order.
 * @param gaussianLabels - The per-element ordinal labels aligned with `atoms`.
 * @param customLabels - The user-assigned labels, indexed by atom.
 * @returns The mapping rows, one per labelled atom.
 */
export function buildLabelMapping(
  atoms: ParsedAtom[],
  gaussianLabels: string[],
  customLabels: Map<number, string>,
): LabelMappingRow[] {
  const rows: LabelMappingRow[] = [];
  for (const [index, customLabel] of customLabels) {
    const atom = atoms[index];
    if (!atom) continue;
    rows.push({
      index,
      element: atom.element,
      gaussianLabel: gaussianLabels[index] ?? `${atom.element}${index + 1}`,
      customLabel,
    });
  }
  return rows.toSorted((a, b) => compareLabels(a.customLabel, b.customLabel));
}

function compareLabels(a: string, b: string): number {
  const numberA = Number.parseInt(a, 10);
  const numberB = Number.parseInt(b, 10);
  const aIsNumber = !Number.isNaN(numberA);
  const bIsNumber = !Number.isNaN(numberB);
  if (aIsNumber && bIsNumber && numberA !== numberB) return numberA - numberB;
  if (aIsNumber && !bIsNumber) return -1;
  if (!aIsNumber && bIsNumber) return 1;
  return a.localeCompare(b);
}
