# Elaeocarpine — NMR-based stereochemistry assignment

## Goal

We have a natural product, **elaeocarpine**, for which the planar (constitutional)
structure is known but the **relative stereochemistry is undetermined**. Four
candidate **stereoisomers** (diastereomers) are plausible. We have **experimental
NMR data** (¹³C and ¹H chemical shifts, plus a set of ¹H–¹H J couplings) for the
real compound, and **DFT/HF GIAO-computed NMR data** for each candidate.

The task is to decide **which of the 4 stereoisomers corresponds to the
experimental data** by comparing computed vs. experimental shifts.

We compare two families of metrics:

1. **Distance metrics** — Mean Absolute Error (**MAE**) and Root-Mean-Square
   Error (**RMSE**) between computed and experimental shifts. Lowest error wins.
2. **Bayesian probability ("probabilité bayésienne")** — the **DP4** and the
   improved **DP4+** methods, which return, for each candidate, the *probability*
   that it is the correct structure given the data (the probabilities sum to 1
   across the candidates). This is more robust than raw MAE/RMSE because it
   weights each error by how surprising it is under an empirically calibrated
   error distribution (Student's *t*).

   - **DP4** — Smith & Goodman, *J. Am. Chem. Soc.* **2010**, 132, 12946.
     DOI [10.1021/ja105035r](https://doi.org/10.1021/ja105035r). PDF in this
     folder: `smith2010.pdf`.
   - **DP4+** — Grimblat, Zanardi & Sarotti, *J. Org. Chem.* **2015**, 80, 12526
     (adds unscaled shifts and a larger basis set; improves discrimination).

## Data in this folder

```
nmr_log/
  smith2010.pdf            # the original DP4 paper
  logs/
    elaeocarpine.mol2      # atom numbering reference (38 atoms) — defines labels
    data_dJ_DP4.xlsx       # experimental data + atom→label mapping for DP4
    {1,2,3,4}_elaeocarpine_c{N}.log   # Gaussian 16 GIAO NMR outputs
```

### The Gaussian log files

21 Gaussian 16 outputs, one per **(stereoisomer, conformer)** pair:

| Stereoisomer | Conformers | Files                       |
| ------------ | ---------- | --------------------------- |
| 1            | 4          | `1_elaeocarpine_c1..c4.log` |
| 2            | 6          | `2_elaeocarpine_c1..c6.log` |
| 3            | 7          | `3_elaeocarpine_c1..c7.log` |
| 4            | 4          | `4_elaeocarpine_c1..c4.log` |

- All 21 jobs reached **Normal termination**.
- Route section (identical in every file): `# nmr=giao hf/sto-3g pop=nbo`
  → GIAO magnetic shielding at the **HF/STO-3G** level (a fast, low-cost level;
  note this is below the basis sets DP4/DP4+ were calibrated on, so the absolute
  numbers should be treated with care).
- Each log contains **38** `Isotropic =` shielding values (one per atom, matching
  the 38 atoms of the mol2), plus an `SCF Done: E(RHF) = …` energy.

The shielding constant (σ, isotropic, in ppm) is what we extract. To turn it into
a chemical shift we either reference it (δ = σ_ref − σ) or use the
linear-scaling / regression approach the DP4 method prescribes.

### Conformers → one value per isomer

Each isomer was computed in several conformations. Before comparing to
experiment, the per-conformer shieldings must be **Boltzmann-averaged** (weights
from the conformer energies — the `SCF Done` energy in each log) to get a single
predicted spectrum per isomer. This averaging step is part of the analysis we
still need to do.

### `elaeocarpine.mol2` — atom numbering

Defines the canonical atom labels used everywhere else (38 atoms: 16 C, 1 N,
2 O, 19 H). The atom indices here (`C1`…`C16`, `N1`, `O1`/`O2`, `H1`…`H19`) are
the labels referenced by the spreadsheet. The Gaussian shielding list is in the
same atom order, so index *i* in the log corresponds to atom *i* in the mol2.

### `data_dJ_DP4.xlsx` — experimental data + mapping

Two sheets:

- **`shifts`** — experimental chemical shifts to use for DP4/MAE/RMSE.
  Columns: `nuclei` (C or H), `exp_data` (experimental δ in ppm), `exchange`
  (flag for averaging chemically-equivalent positions, e.g. methyl/diastereotopic
  protons), and `label 1/2/3` = the mol2 atom index(es) the experimental value
  maps to. 10 ¹³C shifts and 13 ¹H shifts. When `label 2`/`label 3` are present
  (e.g. a CH₃ at atoms 29/30/31), the computed shifts of those atoms are averaged
  before comparison.
- **`J`** — experimental ¹H–¹H coupling constants (Hz) with the pair of mol2
  atom indices (`atom 1`, `atom 4` — i.e. the two ends of the ³J H–C–C–H path)
  and an `exchange` flag. Used for the conformational / J-based cross-check
  (Karplus), complementary to the shift-based DP4.

## What we still need to do

1. Parse the `Isotropic =` shielding values from each of the 21 logs.
2. Boltzmann-average conformers within each isomer using the `SCF Done` energies.
3. Map averaged shieldings to experimental shifts via the `shifts` sheet labels
   (averaging the `exchange`/multi-label sets).
4. Convert shieldings to shifts (scaling/regression) and compute, per isomer:
   - **MAE** and **RMSE** vs experiment (separately for ¹H and ¹C),
   - **DP4** and **DP4+** probabilities.
5. The correct stereoisomer is the one with the lowest MAE/RMSE **and** the
   highest DP4/DP4+ probability — report whether the metrics agree.

## Notes / caveats

- HF/STO-3G is a minimal level; DP4 was parameterized for B3LYP/6-31G\*\*-type
  single points on MMFF/DFT geometries. Re-running the GIAO step at the
  DP4(+)-recommended level may be needed if discrimination is weak.
- Keep ¹H and ¹C statistics separate (different error scales) — DP4 combines them
  through their separate calibrated distributions.
