# stereo-nmr

Drag-and-drop **Gaussian GIAO log files** to group conformers by stereoisomer
and **Boltzmann-average their NMR chemical shifts** at a chosen temperature, with
**linked 2D and 3D atom highlighting**.

A frontend-only React + Vite app, deployed to GitHub Pages.

## What it does

1. **Drop log files.** The number at the start of each file name is the
   **stereoisomer**; files that share that number are **conformers** of the same
   stereoisomer (e.g. `1_elaeocarpine_c1.log`, `1_elaeocarpine_c4.log`).
2. From each log it extracts the per-atom **isotropic shielding σ** (the
   `Isotropic =` GIAO values), the 3D geometry (last *Standard orientation*
   block) and the final **SCF energy**.
3. Conformers are **grouped by stereoisomer**. For each stereoisomer the per-atom
   shieldings are **Boltzmann-averaged** using the SCF energies at the chosen
   temperature: `wᵢ ∝ exp(−(Eᵢ − E_min) / kT)`.
4. Each stereoisomer shows a **per-atom table** (Boltzmann-averaged σ, and δ when
   you provide a reference), a **2D depiction** (react-ocl, with the atom labels
   as custom labels) and an interactive **3D model** (Mol*).
5. **Hovering** an atom in the table, the 2D depiction or the 3D model highlights
   that same atom in all three views.

### Chemical shift vs shielding

The logs contain the **isotropic shielding σ**, which is what is shown by
default. Enter a reference shielding for carbon and/or hydrogen (e.g. the value
computed for TMS at the same level of theory) to convert to a **chemical shift**
`δ = σ_ref − σ`.

### Connectivity and the 2D depiction

Gaussian logs contain coordinates but no bond list. Bonds are perceived from the
3D geometry (covalent-radii distance test); approximate bond orders are assigned
from bond lengths, capped by each atom's valence so aromatic rings come out as a
clean Kekulé pattern. The resulting molecule is laid out in 2D by OpenChemLib
(`inventCoordinates`) and rendered with custom atom labels. Atom order is
preserved end-to-end, so atom *i* is the same atom in the table, the 2D depiction
and the 3D viewer.

## Example dataset

Click **Load example** to load the bundled **elaeocarpine** dataset (21 Gaussian
16 GIAO logs at HF/STO-3G: 4 candidate stereoisomers, 4–7 conformers each).

## Development

```sh
npm install
npm run dev        # start the dev server
npm test           # vitest + coverage, type-check, eslint, prettier
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## Deployment

Pushing to `main` builds the app and publishes `dist/` to **GitHub Pages**
(`.github/workflows/deploy-pages.yml`). The Vite `base` is relative (`./`), so the
site works under any project path (`https://<org>.github.io/<repo>/`). Enable
Pages with the **GitHub Actions** source in the repository settings.

## Tech stack

- **React 19** + **Vite** + **TypeScript**
- **[openchemlib](https://github.com/cheminfo/openchemlib-js)** /
  **[react-ocl](https://github.com/cheminfo/react-ocl)** — 2D depiction
- **[Mol*](https://molstar.org/)** — 3D model
