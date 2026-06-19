import type { ReferenceShifts } from '../lib/references.ts';
import { computeShift } from '../lib/references.ts';

/** One row of the per-atom shift table. */
export interface ShiftRow {
  /** Atom index, stable across the table, the 2D depiction and the 3D viewer. */
  index: number;
  /** Atom label (e.g. `C1`). */
  label: string;
  /** Element symbol. */
  element: string;
  /** Boltzmann-averaged isotropic shielding σ in ppm. */
  sigma: number;
  /** User-assigned custom label, when one has been set for this atom. */
  customLabel?: string;
}

interface ShiftTableProps {
  rows: ShiftRow[];
  references: ReferenceShifts;
  highlightedAtom: number | null;
  onHover: (atom: number | null) => void;
}

/**
 * Renders the per-atom shielding / chemical-shift table. Hovering a row reports
 * the atom index so the linked 2D and 3D views can highlight the same atom.
 * @param props - The component props.
 * @returns The table element.
 */
export function ShiftTable({
  rows,
  references,
  highlightedAtom,
  onHover,
}: ShiftTableProps) {
  const showShift = references.C !== null || references.H !== null;
  const showCustom = rows.some((row) => row.customLabel);
  return (
    <table className="shift-table">
      <thead>
        <tr>
          <th>Atom</th>
          {showCustom ? <th>Custom</th> : null}
          <th>σ (ppm)</th>
          {showShift ? <th>δ (ppm)</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const shift = computeShift(row.element, row.sigma, references);
          return (
            <tr
              key={row.index}
              className={
                row.index === highlightedAtom
                  ? 'shift-table__row shift-table__row--active'
                  : 'shift-table__row'
              }
              onMouseEnter={() => onHover(row.index)}
              onMouseLeave={() => onHover(null)}
            >
              <td>{row.label}</td>
              {showCustom ? <td>{row.customLabel ?? '—'}</td> : null}
              <td>{Number.isNaN(row.sigma) ? '—' : row.sigma.toFixed(2)}</td>
              {showShift ? (
                <td>{shift === null ? '—' : shift.toFixed(2)}</td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
