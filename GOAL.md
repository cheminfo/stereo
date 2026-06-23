# Project goal — stereo-nmr

## In one sentence

Determine the **relative stereochemistry** of a molecule by predicting its NMR
chemical shifts with **ab-initio (GIAO) calculations** for every candidate
diastereomer, comparing those predictions against the **experimental** spectrum,
and reporting a **probability** (DP4 / DP4+) that each candidate is the real
structure.

## The problem

For a natural product the planar (constitutional) structure is known but the
**relative configuration of the stereocenters is not**. A handful of candidate
**diastereomers** are plausible. We want to decide which one matches the measured
NMR data — and quantify how confident that decision is, rather than just eyeballing
the closest fit.

## The method

For each candidate diastereomer we compute NMR shieldings ab initio, reduce them to
one predicted spectrum, compare to experiment, and score the match two ways:

1. **Distance metrics** — Mean Absolute Error (**MAE**) and Root-Mean-Square Error
   (**RMSE**) between predicted and experimental shifts (¹H and ¹³C kept separate).
   Lowest error wins.
2. **Bayesian probability** — **DP4** (Smith & Goodman, *JACS* 2010,
   [10.1021/ja105035r](https://doi.org/10.1021/ja105035r)) and the improved
   **DP4+** (Grimblat, Zanardi & Sarotti, *JOC* 2015). These return, for each
   candidate, the probability that it is the correct structure given the data — the
   probabilities **sum to 1** across candidates. More robust than raw MAE/RMSE
   because each error is weighted by how surprising it is under an empirically
   calibrated error distribution (Student's *t*).

The correct stereoisomer is the one with the lowest MAE/RMSE **and** the highest
DP4/DP4+ probability; we report whether the metrics agree.

## The pipeline

1. **Generate conformers** of each candidate diastereomer and run an ab-initio
   **GIAO** NMR calculation on each (e.g. Gaussian) → one **log file per
   (stereoisomer, conformer)**. Each log holds the per-atom isotropic shielding σ,
   the 3D geometry, and the SCF energy.
2. **Parse** each log → per-atom σ + SCF energy.
3. **Group** conformers by stereoisomer.
4. **Boltzmann-average** each stereoisomer's conformer shieldings (weights from the
   SCF energies, `wᵢ ∝ exp(−(Eᵢ − E_min)/kT)`) → one predicted spectrum per isomer.
5. **Map** predicted atoms → experimental signals, **averaging** chemically
   equivalent atoms (methyl, diastereotopic protons).
6. **Scale** shielding σ → chemical shift δ (linear regression, or a TMS reference
   for the unscaled shifts DP4+ also needs).
7. **Score** each isomer: MAE, RMSE, DP4, DP4+.
8. **Report** the ranking and the per-candidate probabilities.

## Inputs and their formats

Everything is keyed to a **single fixed atom numbering** — the atom order in the
mol2 file, which is the same order as the Gaussian logs. Keeping one numbering
across the structure, the logs, and the experimental table is what makes the
mapping in step 5 unambiguous.

| Input | Format | Provides |
| --- | --- | --- |
| Candidate conformers | Gaussian GIAO **log** files, named `<isomer>_<name>_c<conformer>.log` | isotropic σ, geometry, SCF energy |
| Reference structure | **mol2** file (defines the canonical atom numbering and the bonds) | atom indices used everywhere; connectivity |
| Experimental assignment | **xlsx** with two sheets (see below) | measured shifts and couplings, mapped to atom indices |

### Experimental assignment workbook (`*_dJ_DP4.xlsx`)

Two sheets, both referencing the mol2 atom indices:

- **`shifts`** — one measured signal per row:
  `nuclei` (`C`/`H`) · `exp_data` (δ in ppm) · `exchange` (flag) ·
  `label 1` / `label 2` / `label 3` (the mol2 atom index(es) the signal maps to).
  When more than one label is given (e.g. a methyl `36/37/38`), the predicted
  shifts of those atoms are **averaged** before comparison.
- **`J`** — measured ¹H–¹H coupling constants:
  `exp` (Hz) · `exchange` · `atom 1` · `atom 4` (the two ends of the
  ³J H–C–C–H path). Used for an optional Karplus / conformational cross-check.

## Current state

- **Done in the app** ([src/](src/)): parse logs, group by stereoisomer,
  Boltzmann-average, convert σ → δ with a manual reference, and show a per-atom
  table linked to a 2D depiction and a 3D model.
- **Not yet in the app**: ingesting the experimental assignment and computing the
  MAE / RMSE / DP4 / DP4+ comparison. (A standalone reference implementation of the
  DP4 math lives in [dft-reference/analyze.mjs](dft-reference/analyze.mjs).)

## Worked example: elaeocarpine

Bundled dataset: the natural product **elaeocarpine**, 4 candidate diastereomers,
21 Gaussian 16 GIAO logs at HF/STO-3G (4–7 conformers each) in
[data/example/logs/](data/example/logs/).

Experimental workbooks are in [data/example/xlsx/](data/example/xlsx/). Note they
differ in quality:

- `elaeocarpine_dJ_DP4.xlsx` and `isoelaeocarpine_dJ_DP4.xlsx` — **complete and
  correctly numbered** (16 C + 17 H, labels 1–38 matching the mol2). Use these.
  Their `J` sheets are currently empty.
- `data_dJ_DP4.xlsx` — an **older, incomplete, mis-numbered** file (aliphatic shifts
  attached to aromatic atoms); kept only for reference. This is the "blocker"
  described in [dft-reference/RESULTS.md](dft-reference/RESULTS.md).

> **Caveat on the example level of theory:** HF/STO-3G is below the basis sets DP4 /
> DP4+ were parameterized on (B3LYP/6-31G\*\*-type). The relative ranking is
> indicative, but for trustworthy absolute probabilities the GIAO step should be
> re-run at a DP4-calibrated level.
