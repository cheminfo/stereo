import type { ParsedLog, StereoisomerGroup } from './types.ts';

/**
 * Groups parsed conformers by their stereoisomer number and sorts the groups and
 * their conformers deterministically (groups by number, conformers by SCF energy
 * ascending so the most stable conformer comes first).
 * @param logs - The parsed conformer records.
 * @returns The stereoisomer groups, sorted by stereoisomer number.
 */
export function groupStereoisomers(logs: ParsedLog[]): StereoisomerGroup[] {
  const byNumber = new Map<number, ParsedLog[]>();
  for (const log of logs) {
    const existing = byNumber.get(log.stereoisomer);
    if (existing) {
      existing.push(log);
    } else {
      byNumber.set(log.stereoisomer, [log]);
    }
  }

  const groups: StereoisomerGroup[] = [];
  for (const [stereoisomer, conformers] of byNumber) {
    conformers.sort(byEnergyThenName);
    groups.push({ stereoisomer, conformers });
  }
  groups.sort((a, b) => a.stereoisomer - b.stereoisomer);
  return groups;
}

function byEnergyThenName(a: ParsedLog, b: ParsedLog): number {
  const energyA = a.scfEnergy ?? Infinity;
  const energyB = b.scfEnergy ?? Infinity;
  if (energyA !== energyB) return energyA - energyB;
  return a.fileName.localeCompare(b.fileName);
}
