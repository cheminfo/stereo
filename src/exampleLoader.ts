import type { RawLogFile } from './lib/parseLogs.ts';

const exampleModules = import.meta.glob('../data/example/*.log', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

/**
 * Loads the bundled elaeocarpine example dataset (21 Gaussian GIAO logs) from the
 * project's `data/example` folder, running through the same drag-and-drop path.
 * The files are discovered at build time by `import.meta.glob` and fetched lazily,
 * so they ship as on-demand chunks instead of bloating the main bundle.
 * @returns The example files as raw `{ name, content }` records.
 */
export async function loadExampleFiles(): Promise<RawLogFile[]> {
  const entries = Object.entries(exampleModules).toSorted(([a], [b]) =>
    a.localeCompare(b),
  );
  if (entries.length === 0) {
    throw new Error('No example files found in data/example');
  }
  return Promise.all(
    entries.map(async ([path, load]) => {
      const name = path.slice(path.lastIndexOf('/') + 1);
      return { name, content: await load() };
    }),
  );
}
