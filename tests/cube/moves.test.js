import { describe, it, expect } from 'vitest';
import { applyMove, applyMoves, MOVE_NAMES, INVERSE_MOVE } from '../../src/cube/moves.js';
import { createSolvedState, isSolved } from '../../src/cube/state.js';

describe('Cube Moves', () => {
  const SQUARE = 'BATOREWED';

  function getSolved() {
    return createSolvedState(SQUARE);
  }

  describe('move then inverse = identity', () => {
    const baseMoves = ['U', 'D', 'F', 'B', 'L', 'R'];
    for (const move of baseMoves) {
      it(`${move} then ${move}' returns to solved`, () => {
        const solved = getSolved();
        const after = applyMove(applyMove(solved, move), INVERSE_MOVE[move]);
        expect(after).toEqual(solved);
      });
    }
  });

  describe('any move applied 4 times = identity', () => {
    for (const move of MOVE_NAMES) {
      it(`${move} x4 = identity`, () => {
        const solved = getSolved();
        const after = applyMoves(solved, [move, move, move, move]);
        expect(after).toEqual(solved);
      });
    }
  });

  describe('all 54 stickers present after any move', () => {
    for (const move of MOVE_NAMES) {
      it(`${move} preserves all stickers`, () => {
        // Use a state where every sticker is unique
        const state = Array.from({ length: 54 }, (_, i) => String(i));
        const after = applyMove(state, move);
        const sorted = after.slice().sort((a, b) => Number(a) - Number(b));
        const expected = Array.from({ length: 54 }, (_, i) => String(i)).sort((a, b) => Number(a) - Number(b));
        expect(sorted).toEqual(expected);
      });
    }
  });

  describe('no sticker stays in all positions (non-trivial permutation)', () => {
    for (const move of MOVE_NAMES) {
      it(`${move} changes at least some stickers`, () => {
        const state = Array.from({ length: 54 }, (_, i) => String(i));
        const after = applyMove(state, move);
        const unchanged = after.filter((v, i) => v === String(i)).length;
        // Face moves affect 21 stickers (33 stay). Middle moves affect 12 (42 stay).
        expect(unchanged).toBeLessThanOrEqual(42);
        expect(unchanged).toBeGreaterThanOrEqual(33);
      });
    }
  });

  describe('known sequence test', () => {
    it('sexy move (R U R\' U\') x6 = identity', () => {
      const solved = getSolved();
      const sexy = ["R", "U", "R'", "U'"];
      let state = solved;
      for (let i = 0; i < 6; i++) {
        state = applyMoves(state, sexy);
      }
      expect(state).toEqual(solved);
    });
  });

  describe('move immutability', () => {
    it('applyMove does not modify original state', () => {
      const solved = getSolved();
      const copy = solved.slice();
      applyMove(solved, 'U');
      expect(solved).toEqual(copy);
    });
  });

  describe('applyMoves applies in order', () => {
    it('applies moves sequentially', () => {
      const solved = getSolved();
      const step1 = applyMove(solved, 'U');
      const step2 = applyMove(step1, 'R');
      const combined = applyMoves(solved, ['U', 'R']);
      expect(combined).toEqual(step2);
    });
  });
});
