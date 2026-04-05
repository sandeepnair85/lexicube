/**
 * Cube state representation.
 *
 * The cube has 54 sticker positions (6 faces x 9 stickers).
 * State is a flat array of 54 single-character strings.
 *
 * Face layout (indices):
 *              [U Face]
 *              0  1  2
 *              3  4  5
 *              6  7  8
 *
 *  [L Face]    [F Face]    [R Face]    [B Face]
 *  36 37 38    18 19 20    45 46 47    27 28 29
 *  39 40 41    21 22 23    48 49 50    30 31 32
 *  42 43 44    24 25 26    51 52 53    33 34 35
 *
 *              [D Face]
 *               9 10 11
 *              12 13 14
 *              15 16 17
 *
 * Within each face, stickers are numbered left-to-right, top-to-bottom:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */

// Face offset constants
export const FACE = {
  U: 0,
  D: 9,
  F: 18,
  B: 27,
  L: 36,
  R: 45,
};

export const FACE_NAMES = ['U', 'D', 'F', 'B', 'L', 'R'];

/**
 * Creates a solved cube state where every face shows the given word square.
 * @param {string} wordSquare - 9-character string (e.g., "BATOREWED")
 * @returns {string[]} Array of 54 single characters
 */
export function createSolvedState(wordSquare) {
  const letters = wordSquare.toUpperCase().split('');
  if (letters.length !== 9) {
    throw new Error(`Word square must be 9 characters, got ${letters.length}`);
  }
  const state = new Array(54);
  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < 9; i++) {
      state[face * 9 + i] = letters[i];
    }
  }
  return state;
}

/**
 * Checks if the cube is in the solved state (all faces match the target).
 */
export function isSolved(state, target) {
  for (let i = 0; i < 54; i++) {
    if (state[i] !== target[i]) return false;
  }
  return true;
}

/**
 * Returns a deep copy of a cube state.
 */
export function cloneState(state) {
  return state.slice();
}

/**
 * Extracts a single face (9 stickers) from the state.
 * @param {string[]} state
 * @param {number} faceOffset - One of FACE.U, FACE.D, etc.
 * @returns {string[]} Array of 9 characters
 */
export function getFace(state, faceOffset) {
  return state.slice(faceOffset, faceOffset + 9);
}
