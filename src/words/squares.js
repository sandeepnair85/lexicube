/**
 * Word square database and daily puzzle selection.
 */

import { DICTIONARY, buildPrefixMap } from './dictionary.js';
import { mulberry32, hashString } from '../utils/prng.js';
import { daysSinceEpoch, dateString } from '../utils/date.js';

let _squares = null;

/**
 * Generate all valid 3x3 word squares.
 * Each square is a 9-character uppercase string (row-major).
 * All 3 rows and 3 columns are valid dictionary words.
 */
export function generateAllSquares() {
  if (_squares) return _squares;

  const prefixMap = buildPrefixMap();
  const squares = [];

  const words = [...DICTIONARY];

  for (const row0 of words) {
    for (const row1 of words) {
      const c0prefix = row0[0] + row1[0];
      const c1prefix = row0[1] + row1[1];
      const c2prefix = row0[2] + row1[2];

      const c0words = prefixMap.get(c0prefix) || [];
      const c1words = prefixMap.get(c1prefix) || [];
      const c2words = prefixMap.get(c2prefix) || [];

      if (c0words.length === 0 || c1words.length === 0 || c2words.length === 0) continue;

      for (const c0 of c0words) {
        for (const c1 of c1words) {
          for (const c2 of c2words) {
            const row2 = c0[2] + c1[2] + c2[2];
            if (DICTIONARY.has(row2)) {
              squares.push((row0 + row1 + row2).toUpperCase());
            }
          }
        }
      }
    }
  }

  _squares = squares;
  return squares;
}

/**
 * Get the daily word square for a given date.
 * Deterministic: same date = same square worldwide.
 * @param {Date} date
 * @returns {string} 9-character uppercase string
 */
export function getDailySquare(date = new Date()) {
  const squares = generateAllSquares();
  const ds = dateString(date);
  const seed = hashString('square-' + ds);
  const rng = mulberry32(seed);
  const index = Math.floor(rng() * squares.length);
  return squares[index];
}

/**
 * Get the puzzle number (days since launch).
 */
export function getPuzzleNumber(date = new Date()) {
  return daysSinceEpoch(date) + 1;
}
