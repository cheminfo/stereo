import 'molstar/build/viewer/molstar.css';

import { OrderedSet, SortedArray } from 'molstar/lib/mol-data/int.js';
import type { Loci } from 'molstar/lib/mol-model/loci.js';
import { StructureElement } from 'molstar/lib/mol-model/structure.js';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context.js';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index.js';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18.js';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { useEffect, useLayoutEffect, useRef } from 'react';

interface Molecule3DProps {
  molfile: string;
  highlightedAtom: number | null;
  onHover: (atom: number | null) => void;
}

const HIGHLIGHT_COLOR = Color(0xff_8c_00);

function atomFromLoci(loci: Loci): number | null {
  if (!StructureElement.Loci.is(loci) || loci.elements.length === 0) {
    return null;
  }
  const element = loci.elements[0];
  if (!element) return null;
  const unitIndex = OrderedSet.getAt(element.indices, 0);
  const elementIndex = element.unit.elements[unitIndex];
  return elementIndex === undefined ? null : elementIndex;
}

function applyHighlight(plugin: PluginUIContext, atom: number | null): void {
  const highlights = plugin.managers.interactivity.lociHighlights;
  if (atom === null) {
    highlights.clearHighlights();
    return;
  }
  const structure =
    plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
  if (!structure) return;
  const unit = structure.units[0];
  if (!unit) return;
  const localIndex = SortedArray.indexOf(unit.elements, atom as never);
  if (localIndex === -1) return;
  const loci = StructureElement.Loci(structure, [
    { unit, indices: OrderedSet.ofSingleton(localIndex as never) },
  ]);
  highlights.highlightOnly({ loci });
}

async function loadStructure(
  plugin: PluginUIContext,
  molfile: string,
): Promise<void> {
  await plugin.clear();
  const data = await plugin.builders.data.rawData({
    data: molfile,
    label: '3D structure',
  });
  const trajectory = await plugin.builders.structure.parseTrajectory(
    data,
    'mol',
  );
  await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
}

/**
 * A Mol* 3D viewer for one conformer. Hovering an atom reports its index, and the
 * `highlightedAtom` prop highlights the matching atom — keeping the 3D view in
 * sync with the 2D depiction and the shift table.
 * @param props - The component props.
 * @returns The viewer element.
 */
export function Molecule3D({
  molfile,
  highlightedAtom,
  onHover,
}: Molecule3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const readyRef = useRef(false);
  const onHoverRef = useRef(onHover);
  const highlightedAtomRef = useRef(highlightedAtom);
  const molfileRef = useRef(molfile);

  useLayoutEffect(() => {
    onHoverRef.current = onHover;
    highlightedAtomRef.current = highlightedAtom;
    molfileRef.current = molfile;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let plugin: PluginUIContext | null = null;
    let disposed = false;

    async function create(target: HTMLDivElement) {
      const spec = DefaultPluginUISpec();
      const created = await createPluginUI({
        target,
        render: renderReact18,
        spec: {
          ...spec,
          layout: { initial: { isExpanded: false, showControls: false } },
          components: { remoteState: 'none' },
        },
      });
      if (disposed) {
        created.dispose();
        return;
      }
      plugin = created;
      pluginRef.current = created;
      created.managers.interactivity.setProps({ granularity: 'element' });
      created.canvas3d?.setProps({
        marking: {
          highlightEdgeColor: HIGHLIGHT_COLOR,
          selectEdgeColor: HIGHLIGHT_COLOR,
        },
      });
      created.behaviors.interaction.hover.subscribe((event) => {
        onHoverRef.current(atomFromLoci(event.current.loci));
      });
      readyRef.current = true;
      if (molfileRef.current !== '') {
        await loadStructure(created, molfileRef.current);
        if (!disposed) applyHighlight(created, highlightedAtomRef.current);
      }
    }

    void create(container);

    return () => {
      disposed = true;
      readyRef.current = false;
      pluginRef.current = null;
      plugin?.dispose();
    };
  }, []);

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || !readyRef.current || molfile === '') return;
    let cancelled = false;
    void (async () => {
      await loadStructure(plugin, molfile);
      if (!cancelled) applyHighlight(plugin, highlightedAtomRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [molfile]);

  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin || !readyRef.current) return;
    applyHighlight(plugin, highlightedAtom);
  }, [highlightedAtom]);

  return <div ref={containerRef} className="molecule3d" />;
}
