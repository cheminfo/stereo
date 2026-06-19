import type { LabelMappingRow } from '../lib/customLabels.ts';

interface LabelMappingTableProps {
  rows: LabelMappingRow[];
  highlightedAtom: number | null;
  onHover: (atom: number | null) => void;
  onClearAll: () => void;
}

/**
 * Shows the Gaussian → custom atom-label mapping the user has built. Hovering a
 * row reports the atom index so the linked depictions highlight the same atom.
 * @param props - The component props.
 * @returns The mapping table element.
 */
export function LabelMappingTable({
  rows,
  highlightedAtom,
  onHover,
  onClearAll,
}: LabelMappingTableProps) {
  if (rows.length === 0) {
    return (
      <p className="labeling__empty">
        No custom labels yet — number atoms on the right-hand depiction to build
        the mapping.
      </p>
    );
  }
  return (
    <div className="labeling__mapping">
      <div className="labeling__mapping-head">
        <h3>Mapping</h3>
        <button type="button" onClick={onClearAll}>
          Clear all
        </button>
      </div>
      <table className="shift-table mapping-table">
        <thead>
          <tr>
            <th>Custom</th>
            <th>Gaussian</th>
            <th>Element</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
              <td>{row.customLabel}</td>
              <td>{row.gaussianLabel}</td>
              <td>{row.element}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
