/** Optional reference shieldings (ppm) used to convert σ to a chemical shift δ. */
export interface ReferenceShifts {
  /** Reference isotropic shielding for carbon, or `null` to show σ directly. */
  C: number | null;
  /** Reference isotropic shielding for hydrogen, or `null` to show σ directly. */
  H: number | null;
}

/**
 * Converts an isotropic shielding to a chemical shift `δ = σ_ref − σ` when a
 * reference is provided for that element.
 * @param element - The atom's element symbol.
 * @param sigma - The (Boltzmann-averaged) isotropic shielding in ppm.
 * @param references - The per-element reference shieldings.
 * @returns The chemical shift δ in ppm, or `null` when no reference applies.
 */
export function computeShift(
  element: string,
  sigma: number,
  references: ReferenceShifts,
): number | null {
  const reference =
    element === 'C' ? references.C : element === 'H' ? references.H : null;
  return reference === null ? null : reference - sigma;
}
