/**
 * Extracts the stereoisomer number from the leading digits of a log file name.
 * Files that share the same leading number are different conformers of the same
 * stereoisomer (e.g. `1_elaeocarpine_c1.log` and `1_elaeocarpine_c4.log`).
 * @param fileName - The log file name (with or without a path).
 * @returns The stereoisomer number, or `null` when the name has no leading digits.
 */
export function parseStereoisomerNumber(fileName: string): number | null {
  const baseName = fileName.split('/').at(-1) ?? fileName;
  const match = /^(?<stereoisomer>\d+)/.exec(baseName);
  const value = match?.groups?.stereoisomer;
  if (!value) return null;
  return Number(value);
}
