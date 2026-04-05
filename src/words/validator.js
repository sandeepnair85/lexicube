/**
 * Validates rows and columns of a face for valid words.
 */

import { isValidWord } from './dictionary.js';

/**
 * Given a face (9 characters), returns validation info for all 6 words.
 * @param {string[]} face - Array of 9 characters (3x3 grid, row-major)
 * @returns {{ rows: {word: string, valid: boolean}[], cols: {word: string, valid: boolean}[], allValid: boolean }}
 */
export function validateFace(face) {
  const rows = [
    { word: (face[0] + face[1] + face[2]).toLowerCase(), valid: false },
    { word: (face[3] + face[4] + face[5]).toLowerCase(), valid: false },
    { word: (face[6] + face[7] + face[8]).toLowerCase(), valid: false },
  ];
  const cols = [
    { word: (face[0] + face[3] + face[6]).toLowerCase(), valid: false },
    { word: (face[1] + face[4] + face[7]).toLowerCase(), valid: false },
    { word: (face[2] + face[5] + face[8]).toLowerCase(), valid: false },
  ];

  for (const r of rows) r.valid = isValidWord(r.word);
  for (const c of cols) c.valid = isValidWord(c.word);

  const allValid = rows.every(r => r.valid) && cols.every(c => c.valid);

  return { rows, cols, allValid };
}

/**
 * Count how many of the 6 words on a face are valid.
 */
export function countValidWords(face) {
  const { rows, cols } = validateFace(face);
  return [...rows, ...cols].filter(w => w.valid).length;
}
