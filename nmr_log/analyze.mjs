import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// DP4 / DP4+ stereochemistry analysis for elaeocarpine.
//
//  1. Boltzmann-average the GIAO shieldings of each stereoisomer's conformers
//     at 300 K (weights from the HF SCF energies).  -> RIGOROUS, mapping-free.
//  2. Linear-scale shieldings to shifts, then MAE / RMSE / DP4 per isomer.
//
// IMPORTANT: data_dJ_DP4.xlsx uses an atom numbering that does NOT match the
// Gaussian/mol2 atom order (its carbon labels point at aromatic atoms while the
// experimental shifts are all aliphatic). Until the numbering key is provided,
// the experimental shifts are matched to the computed shieldings by SORTED
// SHIFT ORDER (assignment-free DP4). The carbon ranking below is therefore
// PROVISIONAL; the Boltzmann populations are exact.

const KB_HARTREE_PER_K = 3.166811563e-6; // Boltzmann constant in Hartree/Kelvin
const HARTREE_TO_KCAL = 627.5094740631;
const TEMPERATURE = 300;
const kT = KB_HARTREE_PER_K * TEMPERATURE; // Hartree

// DP4 scaled-error t-distribution parameters (Smith & Goodman, JACS 2010).
const DP4 = {
  C: { sigma: 2.306, nu: 11.38 },
  H: { sigma: 0.185, nu: 14.18 },
};

// Experimental aliphatic 13C shifts (ppm) from data_dJ_DP4.xlsx (sheet "shifts").
const EXP_C = [71.6, 50.2, 23.2, 34.6, 31.7, 45.1, 25.9, 16.1, 16.1, 22.2];

const SP3_SHIELDING_MIN = 160; // cleanly separates the sp3 cluster (>180) from sp2 (<140)

const data = JSON.parse(
  readFileSync(join(import.meta.dirname, 'shieldings.json'), 'utf8'),
);

// ---- group conformers by stereoisomer -------------------------------------
const isomers = new Map();
for (const molecule of data.molecules) {
  if (!isomers.has(molecule.stereoisomer)) isomers.set(molecule.stereoisomer, []);
  isomers.get(molecule.stereoisomer).push(molecule);
}

// ---- Boltzmann population + averaged shielding per atom --------------------
function boltzmann(conformers) {
  let minEnergy = Infinity;
  for (const conformer of conformers) {
    if (conformer.scfEnergy < minEnergy) minEnergy = conformer.scfEnergy;
  }
  const weights = [];
  let partition = 0;
  for (const conformer of conformers) {
    const weight = Math.exp(-(conformer.scfEnergy - minEnergy) / kT);
    weights.push(weight);
    partition += weight;
  }
  for (let i = 0; i < weights.length; i++) weights[i] /= partition;

  const atomCount = conformers[0].shieldings.length;
  const averaged = new Array(atomCount);
  for (let a = 0; a < atomCount; a++) {
    let value = 0;
    for (let c = 0; c < conformers.length; c++) {
      value += weights[c] * conformers[c].shieldings[a].isotropic;
    }
    averaged[a] = { ...conformers[0].shieldings[a], isotropic: value };
  }
  return { weights, minEnergy, averaged };
}

// ---- statistics helpers ----------------------------------------------------
function linearRegression(xs, ys) {
  // ys (shielding) = slope * xs (exp shift) + intercept
  const n = xs.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
    syy += ys[i] * ys[i];
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const r = (n * sxy - sx * sy) /
    Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return { slope, intercept, r2: r * r };
}

function gammaln(x) {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y++;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (front * betacf(a, b, x)) / a;
  return 1 - (front * betacf(b, a, 1 - x)) / b;
}

// one-sided upper-tail probability of |t| under Student-t (paper's 1 - T_nu(|t|))
function tProbability(t, nu) {
  return 0.5 * betai(nu / 2, 0.5, nu / (nu + t * t));
}

// ---- run -------------------------------------------------------------------
const sortedExpC = [...EXP_C].sort((a, b) => b - a); // descending shift
const report = { temperature: TEMPERATURE, isomers: [] };

const perIsomer = [];
for (const [stereoisomer, conformers] of [...isomers.entries()].sort((a, b) => a[0] - b[0])) {
  const { weights, minEnergy, averaged } = boltzmann(conformers);

  // sp3 carbons, sorted by descending shift (= ascending shielding)
  const sp3 = averaged
    .filter((atom) => atom.element === 'C' && atom.isotropic > SP3_SHIELDING_MIN)
    .sort((a, b) => a.isotropic - b.isotropic);

  // assignment-free: match the N highest exp shifts to the N sp3 carbons
  const n = Math.min(sp3.length, sortedExpC.length);
  const expMatched = sortedExpC.slice(0, n);
  const shieldings = sp3.slice(0, n).map((atom) => atom.isotropic);

  const { slope, intercept, r2 } = linearRegression(expMatched, shieldings);
  let sumAbs = 0;
  let sumSq = 0;
  let logProbability = 0;
  for (let i = 0; i < n; i++) {
    const scaled = (shieldings[i] - intercept) / slope;
    const error = scaled - expMatched[i];
    sumAbs += Math.abs(error);
    sumSq += error * error;
    logProbability += Math.log(tProbability(Math.abs(error) / DP4.C.sigma, DP4.C.nu));
  }
  const mae = sumAbs / n;
  const rmse = Math.sqrt(sumSq / n);

  const conformerTable = conformers.map((conformer, index) => ({
    conformer: conformer.conformer,
    deltaEkcal: (conformer.scfEnergy - minEnergy) * HARTREE_TO_KCAL,
    population: weights[index],
  }));

  perIsomer.push({ stereoisomer, mae, rmse, r2, logProbability, slope, intercept, conformerTable });
}

// DP4 normalisation across isomers (product of probabilities -> normalised)
const maxLog = Math.max(...perIsomer.map((p) => p.logProbability));
let dp4Sum = 0;
for (const p of perIsomer) {
  p.dp4Raw = Math.exp(p.logProbability - maxLog);
  dp4Sum += p.dp4Raw;
}
for (const p of perIsomer) p.dp4 = p.dp4Raw / dp4Sum;

report.isomers = perIsomer;
writeFileSync(
  join(import.meta.dirname, 'results.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);

// ---- pretty print ----------------------------------------------------------
let out = `Boltzmann conformer populations at ${TEMPERATURE} K (rigorous)\n`;
out += '='.repeat(60) + '\n';
for (const p of perIsomer) {
  out += `\nStereoisomer ${p.stereoisomer}:\n`;
  for (const c of p.conformerTable) {
    out += `  c${c.conformer}: dE = ${c.deltaEkcal.toFixed(2).padStart(6)} kcal/mol   pop = ${(c.population * 100).toFixed(1).padStart(5)} %\n`;
  }
}

out += '\n\nProvisional CARBON DP4 (assignment-free, sorted-shift matching)\n';
out += '='.repeat(60) + '\n';
out += 'isomer   R2(scale)    MAE      RMSE     DP4(13C)\n';
for (const p of perIsomer) {
  out += `  ${p.stereoisomer}      ${p.r2.toFixed(4)}    ${p.mae.toFixed(2).padStart(5)}    ${p.rmse.toFixed(2).padStart(5)}    ${(p.dp4 * 100).toFixed(1).padStart(5)} %\n`;
}
const best = [...perIsomer].sort((a, b) => b.dp4 - a.dp4)[0];
out += `\nProvisional best fit: stereoisomer ${best.stereoisomer} ` +
  `(DP4 ${(best.dp4 * 100).toFixed(1)} %, RMSE ${best.rmse.toFixed(2)} ppm).\n`;
out += 'WARNING: assignment-free + xlsx numbering mismatch -> treat as indicative only.\n';

process.stdout.write(out);
