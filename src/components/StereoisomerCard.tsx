import { Suspense, lazy, useMemo, useState } from 'react';

import { assignAtomLabels } from '../lib/atomLabels.ts';
import { averageShieldings, conformerPopulations } from '../lib/boltzmann.ts';
import { build2DMolecule, buildMolfile3D } from '../lib/buildMolecule.ts';
import type { ReferenceShifts } from '../lib/references.ts';
import type { ConformerPopulation, StereoisomerGroup } from '../lib/types.ts';

import { Molecule2D } from './Molecule2D.tsx';
import type { ShiftRow } from './ShiftTable.tsx';
import { ShiftTable } from './ShiftTable.tsx';

// Mol* is heavy (~3 MB); load it on demand so it stays out of the initial bundle.
const Molecule3D = lazy(() =>
  import('./Molecule3D.tsx').then((module) => ({ default: module.Molecule3D })),
);

interface StereoisomerCardProps {
  group: StereoisomerGroup;
  temperature: number;
  references: ReferenceShifts;
  defaultExpanded: boolean;
}

const ELEMENT_ORDER: Record<string, number> = { C: 0, H: 1, N: 2, O: 3 };

function buildRows(
  labels: string[],
  averaged: number[],
  group: StereoisomerGroup,
): ShiftRow[] {
  const atoms = group.conformers[0]?.atoms ?? [];
  const rows = atoms.map((atom, index) => ({
    index,
    label: labels[index] ?? `${atom.element}${index + 1}`,
    element: atom.element,
    sigma: averaged[index] ?? Number.NaN,
  }));
  return rows.toSorted(
    (a, b) =>
      (ELEMENT_ORDER[a.element] ?? 9) - (ELEMENT_ORDER[b.element] ?? 9) ||
      a.index - b.index,
  );
}

function shortName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

/**
 * Displays one stereoisomer: the Boltzmann-averaged per-atom shift table linked
 * to a 2D depiction (react-ocl) and a 3D viewer (Mol*), plus the conformer
 * population breakdown.
 * @param props - The component props.
 * @returns The card element.
 */
export function StereoisomerCard({
  group,
  temperature,
  references,
  defaultExpanded,
}: StereoisomerCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);
  const [conformerIndex, setConformerIndex] = useState(0);

  const representative = group.conformers[0];

  const labels = useMemo(
    () => (representative ? assignAtomLabels(representative.atoms) : []),
    [representative],
  );
  const molecule2D = useMemo(
    () =>
      representative ? build2DMolecule(representative.atoms, labels) : null,
    [representative, labels],
  );
  const formula = useMemo(
    () => (molecule2D ? molecule2D.getMolecularFormula().formula : ''),
    [molecule2D],
  );

  const selectedConformer = group.conformers[conformerIndex] ?? representative;
  const molfile3D = useMemo(
    () => (selectedConformer ? buildMolfile3D(selectedConformer.atoms) : ''),
    [selectedConformer],
  );

  const averaged = useMemo(
    () => averageShieldings(group.conformers, temperature),
    [group, temperature],
  );
  const populations = useMemo(
    () => conformerPopulations(group.conformers, temperature),
    [group, temperature],
  );
  const rows = useMemo(
    () => buildRows(labels, averaged, group),
    [labels, averaged, group],
  );

  if (!representative) return null;
  const conformerCount = group.conformers.length;

  return (
    <section className="card">
      <button
        type="button"
        className="card__header"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="card__chevron">{expanded ? '▾' : '▸'}</span>
        <h2>Stereoisomer {group.stereoisomer}</h2>
        <span className="card__meta">
          {formula} · {conformerCount} conformer{conformerCount > 1 ? 's' : ''}
        </span>
      </button>

      {expanded ? (
        <div className="card__body">
          <div className="card__views">
            {molecule2D ? (
              <Molecule2D
                molecule={molecule2D}
                highlightedAtom={hoveredAtom}
                onHover={setHoveredAtom}
              />
            ) : null}
            <div className="card__viewer3d">
              <Suspense
                fallback={
                  <div className="molecule3d molecule3d--loading">
                    Loading 3D viewer…
                  </div>
                }
              >
                <Molecule3D
                  molfile={molfile3D}
                  highlightedAtom={hoveredAtom}
                  onHover={setHoveredAtom}
                />
              </Suspense>
              {conformerCount > 1 ? (
                <label className="card__conformer">
                  3D conformer
                  <select
                    value={conformerIndex}
                    onChange={(event) =>
                      setConformerIndex(Number(event.target.value))
                    }
                  >
                    {populations.map((population, index) => (
                      <option key={population.fileName} value={index}>
                        {shortName(population.fileName)} —{' '}
                        {(population.population * 100).toFixed(1)}%
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <ShiftTable
              rows={rows}
              references={references}
              highlightedAtom={hoveredAtom}
              onHover={setHoveredAtom}
            />
          </div>
          <ConformerPopulations populations={populations} />
        </div>
      ) : null}
    </section>
  );
}

function ConformerPopulations({
  populations,
}: {
  populations: ConformerPopulation[];
}) {
  if (populations.length <= 1) return null;
  return (
    <details className="card__populations">
      <summary>Conformer populations at this temperature</summary>
      <table className="population-table">
        <thead>
          <tr>
            <th>Conformer</th>
            <th>ΔE (kcal/mol)</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          {populations.map((population) => (
            <tr key={population.fileName}>
              <td>{shortName(population.fileName)}</td>
              <td>
                {Number.isNaN(population.relativeEnergyKcal)
                  ? '—'
                  : population.relativeEnergyKcal.toFixed(2)}
              </td>
              <td>{(population.population * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
