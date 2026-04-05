/**
 * Deterministic scramble generator.
 * Generates a sequence of moves based on a date seed.
 */

import { mulberry32, hashString } from '../utils/prng.js';
import { dateString, scrambleMoves } from '../utils/date.js';
import { MOVE_NAMES, MOVE_FACE, FACE_AXIS, INVERSE_MOVE } from './moves.js';

/**
 * Generates a deterministic scramble for a given date.
 * @param {Date} date
 * @returns {{ moves: string[], moveCount: number, seed: number }}
 */
export function generateScramble(date = new Date()) {
  const ds = dateString(date);
  const seed = hashString(ds);
  const moveCount = scrambleMoves(date);
  const rng = mulberry32(seed);

  const moves = [];
  const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
  let lastFace = null;
  let secondLastFace = null;

  for (let i = 0; i < moveCount; i++) {
    // Filter available faces: no consecutive same face
    let available = faces.filter(f => f !== lastFace);

    // If last two moves were on the same axis (e.g., U then D),
    // exclude the entire axis to avoid redundant sequences
    if (lastFace && secondLastFace && FACE_AXIS[lastFace] === FACE_AXIS[secondLastFace]) {
      const blockedAxis = FACE_AXIS[lastFace];
      available = available.filter(f => FACE_AXIS[f] !== blockedAxis);
    }

    // Pick a face
    const face = available[Math.floor(rng() * available.length)];

    // Pick direction: CW or CCW
    const move = rng() < 0.5 ? face : face + "'";

    moves.push(move);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return { moves, moveCount, seed };
}

/**
 * Returns the inverse of a scramble (the solution).
 * @param {string[]} moves
 * @returns {string[]}
 */
export function invertScramble(moves) {
  return moves.map(m => INVERSE_MOVE[m]).reverse();
}
