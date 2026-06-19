import type { ParsedAtom } from './types.ts';

/**
 * Assigns a per-element ordinal label to each atom in file order
 * (`C1, C2, …, O1, O2, …, H1, …`). For data exported from a mol2 with
 * element-sequential numbering (as in the elaeocarpine set) this reproduces the
 * original atom labels exactly.
 * @param atoms - The atoms in their parsed (file) order.
 * @returns An array of labels aligned with the input atoms by index.
 */
export function assignAtomLabels(atoms: ParsedAtom[]): string[] {
  const counts = new Map<string, number>();
  const labels: string[] = [];
  for (const atom of atoms) {
    const next = (counts.get(atom.element) ?? 0) + 1;
    counts.set(atom.element, next);
    labels.push(`${atom.element}${next}`);
  }
  return labels;
}
