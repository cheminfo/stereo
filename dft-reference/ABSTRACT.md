# Elaeocarpine stereochemistry — project abstract

## In one paragraph

We are assigning the **relative stereochemistry of elaeocarpine** by comparing
**GIAO-computed NMR shieldings** for **4 candidate stereoisomers** against the
**experimental ¹³C/¹H shifts and ¹H–¹H J couplings** of the real compound. The
winning isomer is the one with the lowest **MAE/RMSE** and the highest
**Bayesian DP4 / DP4+ probability**. Raw Gaussian logs have been parsed down to a
single compact JSON ready for that analysis.

## Inputs

| Item | What | Notes |
| --- | --- | --- |
| 4 stereoisomers | diastereomer candidates `1–4` | only relative config is unknown |
| 21 Gaussian 16 logs | `{1..4}_elaeocarpine_c{N}.log` | conformers per isomer: 1→4, 2→6, 3→7, 4→4 |
| Level of theory | `# nmr=giao hf/sto-3g pop=nbo` | minimal basis; below DP4 calibration |
| `elaeocarpine.mol2` | 38-atom numbering (16 C, 1 N, 2 O, 19 H) | defines labels used everywhere |
| `data_dJ_DP4.xlsx` | experimental data + atom→label map | sheets `shifts` and `J` |
| `smith2010.pdf` | original DP4 paper | DOI 10.1021/ja105035r |

## Experimental data (from `data_dJ_DP4.xlsx`)

- **`shifts`**: 10 ¹³C shifts (16.1–71.6 ppm) and 13 ¹H shifts (0.83–3.43 ppm),
  each mapped to one or more mol2 atom indices; an `exchange` flag and
  `label 2/3` columns mark equivalent groups (e.g. CH₃ at atoms 29/30/31) that
  must be **averaged** before comparison.
- **`J`**: 11 ¹H–¹H coupling constants (3.0–13.1 Hz) given as atom-index pairs
  (`atom 1` / `atom 4`), for a Karplus/conformational cross-check.

## Methods compared

1. **MAE** and **RMSE** of computed vs experimental shifts (¹H and ¹C separately) — lowest error wins.
2. **DP4** (Smith & Goodman, *JACS* 2010) — Bayesian probability per candidate, summing to 1, using a calibrated Student's-*t* error model.
3. **DP4+** (Grimblat & Sarotti, *JOC* 2015) — adds unscaled shifts + larger basis; better discrimination.

## What has been done

- **Context** documented in `CONTEXT.md`.
- **Logs parsed** by `parseLogs.mjs` → `shieldings.json`:
  - **5.3 MB of logs → 85 KB JSON** (only the data DP4 needs).
  - Per molecule: `stereoisomer`, `conformer`, `scfEnergy` (for Boltzmann
    weighting), `normalTermination`, `atomCount`, and the 38
    `{index, element, isotropic}` shieldings in mol2 atom order.
  - Validated: 21/21 normal termination, all 38 atoms, conformer counts correct.

## What remains

1. Boltzmann-average conformer shieldings per isomer (weights from `scfEnergy`).
2. Map shieldings → experimental shifts via the `shifts` labels (averaging
   `exchange` / multi-label sets).
3. Scale shieldings to shifts, then compute MAE, RMSE, DP4 and DP4+ per isomer.
4. Report the best isomer and whether the metrics agree.

## Caveat

HF/STO-3G is below the level DP4/DP4+ were parameterized on (B3LYP/6-31G\*\*-type).
If discrimination between isomers is weak, the GIAO step should be re-run at the
recommended level.

## Files

```
nmr_log/
  ABSTRACT.md        # this file
  CONTEXT.md         # full project context
  parseLogs.mjs      # log -> JSON extractor
  shieldings.json    # compact parsed data (analysis input)
  smith2010.pdf      # DP4 paper
  logs/              # 21 Gaussian logs + elaeocarpine.mol2 + data_dJ_DP4.xlsx
```
