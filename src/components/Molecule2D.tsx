import type { Molecule } from 'openchemlib';
import { SvgRenderer } from 'react-ocl';

interface Molecule2DProps {
  molecule: Molecule;
  highlightedAtom: number | null;
  onHover: (atom: number | null) => void;
}

/**
 * Renders a 2D depiction (with custom atom labels) using react-ocl. Atom indices
 * match the shift table and the 3D viewer, so highlight and hover stay in sync.
 * @param props - The component props.
 * @returns The depiction element.
 */
export function Molecule2D({
  molecule,
  highlightedAtom,
  onHover,
}: Molecule2DProps) {
  return (
    <div className="molecule2d">
      <SvgRenderer
        molecule={molecule}
        width={360}
        height={300}
        autoCrop
        atomHighlight={highlightedAtom === null ? [] : [highlightedAtom]}
        atomHighlightColor="#ff8c00"
        onAtomEnter={(atom) => onHover(atom)}
        onAtomLeave={() => onHover(null)}
      />
    </div>
  );
}
