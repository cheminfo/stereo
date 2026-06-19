import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Extracts the essential data from each Gaussian GIAO log into a single compact
// JSON file, so downstream MAE/RMSE/DP4 analysis never has to re-read the ~5 MB
// of raw logs. Per log we keep: stereoisomer, conformer, SCF energy, normal
// termination, and the per-atom isotropic shielding (the only numbers DP4 needs).

const logsDir = join(import.meta.dirname, 'logs');
const outFile = join(import.meta.dirname, 'shieldings.json');

const fileNamePattern = /^(\d+)_elaeocarpine_c(\d+)\.log$/;
const isotropicPattern = /^\s*(\d+)\s+([A-Z][a-z]?)\s+Isotropic =\s+(-?\d+\.\d+)/;
const scfPattern = /SCF Done:\s+E\(\w+\)\s+=\s+(-?\d+\.\d+)/;

const files = readdirSync(logsDir)
  .filter((name) => fileNamePattern.test(name))
  .sort();

const molecules = [];

for (const name of files) {
  const match = fileNamePattern.exec(name);
  const stereoisomer = Number(match[1]);
  const conformer = Number(match[2]);
  const content = readFileSync(join(logsDir, name), 'latin1');

  const normalTermination = content.includes('Normal termination');
  const scfMatch = scfPattern.exec(content);
  const scfEnergy = scfMatch ? Number(scfMatch[1]) : null;

  const atoms = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const shieldingMatch = isotropicPattern.exec(lines[i]);
    if (shieldingMatch) {
      atoms.push({
        index: Number(shieldingMatch[1]),
        element: shieldingMatch[2],
        isotropic: Number(shieldingMatch[3]),
      });
    }
  }

  molecules.push({
    file: name,
    stereoisomer,
    conformer,
    normalTermination,
    scfEnergy,
    atomCount: atoms.length,
    shieldings: atoms,
  });
}

const result = {
  source: 'Gaussian 16 GIAO, # nmr=giao hf/sto-3g pop=nbo',
  generated: 'parseLogs.mjs',
  count: molecules.length,
  molecules,
};

writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);

const byIsomer = {};
for (const molecule of molecules) {
  byIsomer[molecule.stereoisomer] = (byIsomer[molecule.stereoisomer] || 0) + 1;
}
process.stdout.write(
  `Parsed ${molecules.length} logs -> ${outFile}\n` +
    `Conformers per stereoisomer: ${JSON.stringify(byIsomer)}\n` +
    `All normal termination: ${molecules.every((m) => m.normalTermination)}\n` +
    `Atom count consistent (38): ${molecules.every((m) => m.atomCount === 38)}\n`,
);
