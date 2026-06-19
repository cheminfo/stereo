import { expect, test } from 'vitest';

import { computeShift } from '../references.ts';

test('returns null when no reference is set for the element', () => {
  expect(computeShift('C', 100, { C: null, H: null })).toBeNull();
});

test('computes δ = σ_ref − σ for the matching element', () => {
  expect(computeShift('C', 80, { C: 190, H: null })).toBe(110);
  expect(computeShift('H', 30, { C: null, H: 32 })).toBe(2);
});

test('elements without a reference (N, O) stay null', () => {
  expect(computeShift('O', 50, { C: 190, H: 32 })).toBeNull();
});
