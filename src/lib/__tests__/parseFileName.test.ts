import { expect, test } from 'vitest';

import { parseStereoisomerNumber } from '../parseFileName.ts';

test('reads the leading stereoisomer number', () => {
  expect(parseStereoisomerNumber('1_elaeocarpine_c1.log')).toBe(1);
  expect(parseStereoisomerNumber('3_elaeocarpine_c7.log')).toBe(3);
  expect(parseStereoisomerNumber('12_foo.log')).toBe(12);
});

test('ignores any leading path', () => {
  expect(parseStereoisomerNumber('logs/2_elaeocarpine_c4.log')).toBe(2);
});

test('returns null when there is no leading number', () => {
  expect(parseStereoisomerNumber('elaeocarpine.log')).toBeNull();
});
