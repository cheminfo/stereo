import type { ReferenceShifts } from '../lib/references.ts';

interface ControlsProps {
  temperature: number;
  onTemperatureChange: (temperature: number) => void;
  references: ReferenceShifts;
  onReferencesChange: (references: ReferenceShifts) => void;
  onLoadExample: () => void;
  onClear: () => void;
  hasData: boolean;
  loading: boolean;
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The top control bar: averaging temperature, optional per-element reference
 * shieldings, and the example / clear actions.
 * @param props - The component props.
 * @returns The controls element.
 */
export function Controls({
  temperature,
  onTemperatureChange,
  references,
  onReferencesChange,
  onLoadExample,
  onClear,
  hasData,
  loading,
}: ControlsProps) {
  return (
    <div className="controls">
      <label className="controls__field">
        Temperature (K)
        <input
          type="number"
          min={1}
          step={1}
          value={temperature}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            if (Number.isFinite(parsed) && parsed > 0) {
              onTemperatureChange(parsed);
            }
          }}
        />
      </label>

      <label className="controls__field">
        Ref σ(C) (ppm)
        <input
          type="number"
          step="any"
          placeholder="σ → δ"
          value={references.C ?? ''}
          onChange={(event) =>
            onReferencesChange({
              ...references,
              C: parseOptionalNumber(event.target.value),
            })
          }
        />
      </label>

      <label className="controls__field">
        Ref σ(H) (ppm)
        <input
          type="number"
          step="any"
          placeholder="σ → δ"
          value={references.H ?? ''}
          onChange={(event) =>
            onReferencesChange({
              ...references,
              H: parseOptionalNumber(event.target.value),
            })
          }
        />
      </label>

      <div className="controls__actions">
        <button type="button" onClick={onLoadExample} disabled={loading}>
          {loading ? 'Loading…' : 'Load example'}
        </button>
        <button type="button" onClick={onClear} disabled={!hasData}>
          Clear
        </button>
      </div>
    </div>
  );
}
