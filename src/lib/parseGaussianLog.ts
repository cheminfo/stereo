import { atomicNumberFromSymbol, symbolFromAtomicNumber } from './elements.ts';
import { parseStereoisomerNumber } from './parseFileName.ts';
import type { ParsedAtom, ParsedLog } from './types.ts';

const SCF_PATTERN = /SCF Done:\s+E\(\S+\)\s+=\s+(?<energy>-?\d+\.\d+)/g;
const ISOTROPIC_PATTERN =
  /^\s*(?<center>\d+)\s+(?<symbol>[A-Z][a-z]?)\s+Isotropic =\s+(?<shielding>-?\d+\.\d+)/;
const COORDINATE_PATTERN =
  /^\s*(?<center>\d+)\s+(?<atomicNumber>\d+)\s+(?<atomicType>-?\d+)\s+(?<x>-?\d+\.\d+)\s+(?<y>-?\d+\.\d+)\s+(?<z>-?\d+\.\d+)\s*$/;

interface Coordinate {
  atomicNumber: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Parses one Gaussian GIAO log file into a structured conformer record:
 * the per-atom isotropic shieldings, 3D coordinates, SCF energy, and the
 * stereoisomer number taken from the leading digits of the file name.
 * @param fileName - The log file name (drives stereoisomer grouping).
 * @param content - The full text content of the log file.
 * @returns The parsed conformer data.
 * @throws If the file contains no `Isotropic =` shielding values.
 */
export function parseGaussianLog(fileName: string, content: string): ParsedLog {
  const lines = content.split('\n');
  const normalTermination = content.includes('Normal termination');
  const scfEnergy = lastScfEnergy(content);
  const coordinates = parseLastOrientation(lines);

  const atoms: ParsedAtom[] = [];
  for (const line of lines) {
    const groups = ISOTROPIC_PATTERN.exec(line)?.groups;
    if (!groups?.center || !groups.symbol || !groups.shielding) continue;
    const coordinate = coordinates[Number(groups.center) - 1];
    const atomicNumber =
      coordinate?.atomicNumber ?? atomicNumberFromSymbol(groups.symbol);
    atoms.push({
      atomicNumber,
      element: symbolFromAtomicNumber(atomicNumber),
      x: coordinate?.x ?? 0,
      y: coordinate?.y ?? 0,
      z: coordinate?.z ?? 0,
      isotropic: Number(groups.shielding),
    });
  }

  if (atoms.length === 0) {
    throw new Error(
      `No GIAO "Isotropic =" shielding values found in "${fileName}".`,
    );
  }

  return {
    fileName,
    stereoisomer: parseStereoisomerNumber(fileName) ?? 0,
    scfEnergy,
    normalTermination,
    atoms,
  };
}

function lastScfEnergy(content: string): number | null {
  let last: number | null = null;
  for (const match of content.matchAll(SCF_PATTERN)) {
    if (match.groups?.energy) last = Number(match.groups.energy);
  }
  return last;
}

function parseLastOrientation(lines: string[]): Coordinate[] {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line &&
      (line.includes('Standard orientation:') ||
        line.includes('Input orientation:'))
    ) {
      start = i;
    }
  }
  if (start === -1) return [];

  const coordinates: Coordinate[] = [];
  let started = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) break;
    const groups = COORDINATE_PATTERN.exec(line)?.groups;
    if (groups?.atomicNumber && groups.x && groups.y && groups.z) {
      started = true;
      coordinates.push({
        atomicNumber: Number(groups.atomicNumber),
        x: Number(groups.x),
        y: Number(groups.y),
        z: Number(groups.z),
      });
    } else if (started) {
      break;
    }
  }
  return coordinates;
}
