import type { RawLogFile } from './lib/parseLogs.ts';

/**
 * Loads the bundled elaeocarpine example dataset (21 Gaussian GIAO logs) from the
 * site's `public/example` folder, running through the same drag-and-drop path.
 * @returns The example files as raw `{ name, content }` records.
 */
export async function loadExampleFiles(): Promise<RawLogFile[]> {
  const base = import.meta.env.BASE_URL;
  const manifestResponse = await fetch(`${base}example/manifest.json`);
  if (!manifestResponse.ok) {
    throw new Error(`manifest.json (HTTP ${manifestResponse.status})`);
  }
  const names = (await manifestResponse.json()) as string[];

  return Promise.all(
    names.map(async (name) => {
      const response = await fetch(`${base}example/${name}`);
      if (!response.ok) {
        throw new Error(`${name} (HTTP ${response.status})`);
      }
      return { name, content: await response.text() };
    }),
  );
}
