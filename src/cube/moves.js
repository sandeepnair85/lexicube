/**
 * Rubik's cube move definitions using cycle notation.
 *
 * Each move is defined as an array of 4-cycles.
 * A 4-cycle [a, b, c, d] means: a->b, b->c, c->d, d->a (clockwise).
 *
 * Face layout reference (from state.js):
 *              [U: 0-8]
 *  [L: 36-44]  [F: 18-26]  [R: 45-53]  [B: 27-35]
 *              [D: 9-17]
 */

import { cloneState } from './state.js';

// ---- Move cycle definitions (clockwise quarter turns) ----

// U face clockwise (looking from above)
// Band: F top -> R top -> B top -> L top -> F top
const U_CW = [
  [0, 2, 8, 6],       // face corners
  [1, 5, 7, 3],       // face edges
  [18, 45, 27, 36],   // band
  [19, 46, 28, 37],
  [20, 47, 29, 38],
];

// D face clockwise (looking from below)
// Band: F bottom -> L bottom -> B bottom -> R bottom -> F bottom
const D_CW = [
  [9, 11, 17, 15],    // face corners
  [10, 14, 16, 12],   // face edges
  [24, 42, 33, 51],   // band
  [25, 43, 34, 52],
  [26, 44, 35, 53],
];

// F face clockwise (looking at front)
const F_CW = [
  [18, 20, 26, 24],   // face corners
  [19, 23, 25, 21],   // face edges
  [6, 45, 11, 44],    // band
  [7, 48, 10, 41],
  [8, 51, 9, 38],
];

// B face clockwise (looking from back)
const B_CW = [
  [27, 29, 35, 33],   // face corners
  [28, 32, 34, 30],   // face edges
  [2, 36, 15, 53],    // band
  [1, 39, 16, 50],
  [0, 42, 17, 47],
];

// L face clockwise (looking from left)
const L_CW = [
  [36, 38, 44, 42],   // face corners
  [37, 41, 43, 39],   // face edges
  [0, 18, 9, 35],     // band
  [3, 21, 12, 32],
  [6, 24, 15, 29],
];

// R face clockwise (looking from right)
const R_CW = [
  [45, 47, 53, 51],   // face corners
  [46, 50, 52, 48],   // face edges
  [8, 27, 17, 26],    // band
  [5, 30, 14, 23],
  [2, 33, 11, 20],
];

// M move clockwise (Middle layer, same direction as L, x=0 slice)
const M_CW = [
  [1, 19, 10, 34],
  [4, 22, 13, 31],
  [7, 25, 16, 28],
];

// E move clockwise (Equatorial layer, same direction as D, y=0 slice)
const E_CW = [
  [21, 39, 30, 48],
  [22, 40, 31, 49],
  [23, 41, 32, 50],
];

// S move clockwise (Standing layer, same direction as F, z=0 slice)
const S_CW = [
  [3, 46, 14, 43],
  [4, 49, 13, 40],
  [5, 52, 12, 37],
];

// ---- Move application ----

/**
 * Applies a set of 4-cycles (clockwise) to a state.
 * Each cycle [a,b,c,d] moves: a->b, b->c, c->d, d->a.
 */
function applyCycles(state, cycles) {
  const result = cloneState(state);
  for (const [a, b, c, d] of cycles) {
    result[b] = state[a];
    result[c] = state[b];
    result[d] = state[c];
    result[a] = state[d];
  }
  return result;
}

/**
 * Applies the inverse (counter-clockwise) of a set of 4-cycles.
 * Each cycle [a,b,c,d] reversed: a->d, d->c, c->b, b->a.
 */
function applyCyclesInverse(state, cycles) {
  const result = cloneState(state);
  for (const [a, b, c, d] of cycles) {
    result[d] = state[a];
    result[c] = state[d];
    result[b] = state[c];
    result[a] = state[b];
  }
  return result;
}

// Move definitions: { name, cycles }
const MOVE_DEFS = {
  U: U_CW, D: D_CW, F: F_CW, B: B_CW, L: L_CW, R: R_CW,
  M: M_CW, E: E_CW, S: S_CW,
};

// All move names (outer + middle layers)
export const MOVE_NAMES = [
  'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'L', "L'", 'R', "R'",
  'M', "M'", 'E', "E'", 'S', "S'",
];

export const MOVE_FACE = {
  'U': 'U', "U'": 'U', 'D': 'D', "D'": 'D',
  'F': 'F', "F'": 'F', 'B': 'B', "B'": 'B',
  'L': 'L', "L'": 'L', 'R': 'R', "R'": 'R',
  'M': 'M', "M'": 'M', 'E': 'E', "E'": 'E',
  'S': 'S', "S'": 'S',
};

export const FACE_AXIS = {
  'U': 'UD', 'D': 'UD', 'E': 'UD',
  'F': 'FB', 'B': 'FB', 'S': 'FB',
  'L': 'LR', 'R': 'LR', 'M': 'LR',
};

export const INVERSE_MOVE = {
  'U': "U'", "U'": 'U', 'D': "D'", "D'": 'D',
  'F': "F'", "F'": 'F', 'B': "B'", "B'": 'B',
  'L': "L'", "L'": 'L', 'R': "R'", "R'": 'R',
  'M': "M'", "M'": 'M', 'E': "E'", "E'": 'E',
  'S': "S'", "S'": 'S',
};

/**
 * Applies a single move to a cube state. Returns a new state.
 * @param {string[]} state - 54-element array
 * @param {string} move - One of MOVE_NAMES (e.g., 'U', "U'", 'F', etc.)
 * @returns {string[]} New state
 */
export function applyMove(state, move) {
  const isPrime = move.endsWith("'");
  const baseFace = isPrime ? move.slice(0, -1) : move;
  const cycles = MOVE_DEFS[baseFace];

  if (!cycles) {
    throw new Error(`Unknown move: ${move}`);
  }

  if (isPrime) {
    return applyCyclesInverse(state, cycles);
  }
  return applyCycles(state, cycles);
}

/**
 * Applies a sequence of moves to a state. Returns a new state.
 */
export function applyMoves(state, moves) {
  let current = state;
  for (const move of moves) {
    current = applyMove(current, move);
  }
  return current;
}
