import { useCallback, useMemo, useState } from 'react';

import { AtomLabeling } from './components/AtomLabeling.tsx';
import { Controls } from './components/Controls.tsx';
import { DropZone } from './components/DropZone.tsx';
import { StereoisomerCard } from './components/StereoisomerCard.tsx';
import { loadExampleFiles } from './exampleLoader.ts';
import { assignAtomLabels } from './lib/atomLabels.ts';
import { DEFAULT_TEMPERATURE_K } from './lib/constants.ts';
import { groupStereoisomers } from './lib/groupStereoisomers.ts';
import type { RawLogFile } from './lib/parseLogs.ts';
import { mergeLogs, parseLogFiles } from './lib/parseLogs.ts';
import type { ReferenceShifts } from './lib/references.ts';
import type { ParsedLog } from './lib/types.ts';

/**
 * Root application: holds the parsed logs, the averaging temperature and the
 * optional reference shieldings, and renders one card per stereoisomer.
 * @returns The application element.
 */
export function App() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE_K);
  const [references, setReferences] = useState<ReferenceShifts>({
    C: null,
    H: null,
  });
  const [loading, setLoading] = useState(false);
  const [customLabels, setCustomLabels] = useState<Map<number, string>>(
    new Map(),
  );

  const groups = useMemo(() => groupStereoisomers(logs), [logs]);

  const representativeAtoms = useMemo(
    () => groups[0]?.conformers[0]?.atoms ?? null,
    [groups],
  );
  const gaussianLabels = useMemo(
    () => (representativeAtoms ? assignAtomLabels(representativeAtoms) : []),
    [representativeAtoms],
  );
  // Drop stale per-index labels when a different molecule is loaded; identical
  // constitution (more conformers of the same molecule) keeps the labelling.
  // Reset during render — the documented pattern for adjusting state on a
  // changing input — rather than in an effect.
  const atomSignature = useMemo(
    () => representativeAtoms?.map((atom) => atom.element).join(',') ?? '',
    [representativeAtoms],
  );
  const [labelledSignature, setLabelledSignature] = useState(atomSignature);
  if (labelledSignature !== atomSignature) {
    setLabelledSignature(atomSignature);
    setCustomLabels(new Map());
  }

  const handleFiles = useCallback((files: RawLogFile[]) => {
    const { logs: parsed, errors: parseErrors } = parseLogFiles(files);
    setLogs((previous) => mergeLogs(previous, parsed));
    setErrors(parseErrors);
  }, []);

  const handleExample = useCallback(() => {
    setLoading(true);
    void loadExampleFiles()
      .then((files) => handleFiles(files))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setErrors([`Failed to load example: ${message}`]);
      })
      .finally(() => setLoading(false));
  }, [handleFiles]);

  const handleClear = useCallback(() => {
    setLogs([]);
    setErrors([]);
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Stereoisomer NMR — Boltzmann-averaged shifts</h1>
        <p>
          Drop Gaussian GIAO log files to group conformers by stereoisomer and
          Boltzmann-average their isotropic shieldings at a chosen temperature.
          Hover an atom in the table, the 2D depiction or the 3D model to
          highlight it in all three.
        </p>
      </header>

      <Controls
        temperature={temperature}
        onTemperatureChange={setTemperature}
        references={references}
        onReferencesChange={setReferences}
        onLoadExample={handleExample}
        onClear={handleClear}
        hasData={logs.length > 0}
        loading={loading}
      />

      <DropZone onFiles={handleFiles} />

      {errors.length > 0 ? (
        <ul className="errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {groups.length === 0 ? (
        <p className="empty">
          No data yet — drop log files above or load the bundled elaeocarpine
          example.
        </p>
      ) : (
        <>
          <p className="summary">
            {groups.length} stereoisomer{groups.length > 1 ? 's' : ''} ·{' '}
            {logs.length} conformers
          </p>
          {representativeAtoms ? (
            <AtomLabeling
              atoms={representativeAtoms}
              gaussianLabels={gaussianLabels}
              customLabels={customLabels}
              onChange={setCustomLabels}
            />
          ) : null}
          {groups.map((group, index) => (
            <StereoisomerCard
              key={group.stereoisomer}
              group={group}
              temperature={temperature}
              references={references}
              customLabels={customLabels}
              defaultExpanded={index === 0}
            />
          ))}
        </>
      )}
    </div>
  );
}
