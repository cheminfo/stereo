import type { Molecule } from 'openchemlib';
import { useCallback, useMemo, useState } from 'react';
import { SvgEditor } from 'react-ocl';

import { build2DMolecule, buildBareMolecule } from '../lib/buildMolecule.ts';
import { buildLabelMapping, extractCustomLabels } from '../lib/customLabels.ts';
import type { ParsedAtom } from '../lib/types.ts';

import { LabelMappingTable } from './LabelMappingTable.tsx';
import { Molecule2D } from './Molecule2D.tsx';

interface AtomLabelingProps {
  atoms: ParsedAtom[];
  gaussianLabels: string[];
  customLabels: Map<number, string>;
  onChange: (labels: Map<number, string>) => void;
}

/**
 * Lets the user assign their own atom numbering on a clean depiction and shows
 * the resulting Gaussian → custom mapping. Hover an atom and press Space (or `'`)
 * to auto-number it, click an atom to type a label, or press Backspace to clear.
 * @param props - The component props.
 * @returns The labeling panel element.
 */
export function AtomLabeling({
  atoms,
  gaussianLabels,
  customLabels,
  onChange,
}: AtomLabelingProps) {
  const [highlightedAtom, setHighlightedAtom] = useState<number | null>(null);

  const referenceMolecule = useMemo(
    () => build2DMolecule(atoms, gaussianLabels),
    [atoms, gaussianLabels],
  );
  // Invent the depiction once; labels are applied to a copy so numbering an atom
  // never re-lays-out the structure.
  const baseMolecule = useMemo(() => buildBareMolecule(atoms), [atoms]);
  const editorMolecule = useMemo(() => {
    const molecule = baseMolecule.getCompactCopy();
    for (const [index, label] of customLabels) {
      molecule.setAtomCustomLabel(index, `]${label}`);
    }
    return molecule;
  }, [baseMolecule, customLabels]);

  const mappingRows = useMemo(
    () => buildLabelMapping(atoms, gaussianLabels, customLabels),
    [atoms, gaussianLabels, customLabels],
  );

  const handleEditorChange = useCallback(
    (molecule: Molecule) => onChange(extractCustomLabels(molecule)),
    [onChange],
  );
  const handleClearAll = useCallback(() => onChange(new Map()), [onChange]);

  const editorHighlight = highlightedAtom === null ? [] : [highlightedAtom];

  return (
    <section className="card labeling">
      <div className="labeling__header">
        <h2>Atom labeling</h2>
        <span className="card__meta">
          {mappingRows.length} / {atoms.length} atoms labelled
        </span>
      </div>
      <div className="card__body">
        <p className="labeling__hint">
          Hover an atom and press <kbd>Space</kbd> to number it automatically,
          click an atom to type a custom label, or press <kbd>Backspace</kbd> to
          clear it. The left depiction keeps the Gaussian numbering for
          reference.
        </p>
        <div className="labeling__views">
          <figure className="labeling__figure">
            <figcaption>Gaussian numbering</figcaption>
            <Molecule2D
              molecule={referenceMolecule}
              highlightedAtom={highlightedAtom}
              onHover={setHighlightedAtom}
            />
          </figure>
          <figure className="labeling__figure">
            <figcaption>Your labels</figcaption>
            <div className="molecule2d">
              <SvgEditor
                molecule={editorMolecule}
                onChange={handleEditorChange}
                width={360}
                height={300}
                autoCrop
                atomHighlight={editorHighlight}
                atomHighlightColor="#ff8c00"
                atomHighlightStrategy="prefer-editor-state"
                onAtomEnter={(atom) => setHighlightedAtom(atom)}
                onAtomLeave={() => setHighlightedAtom(null)}
              />
            </div>
          </figure>
        </div>
        <LabelMappingTable
          rows={mappingRows}
          highlightedAtom={highlightedAtom}
          onHover={setHighlightedAtom}
          onClearAll={handleClearAll}
        />
      </div>
    </section>
  );
}
