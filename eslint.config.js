import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores(['coverage', 'dist']),
  ts,
  unicorn,
  react,
  {
    // Mol* exposes uppercase factory calls that are not constructors
    // (e.g. Color(...), StructureElement.Loci(...)).
    rules: { 'new-cap': ['error', { capIsNew: false }] },
  },
);
