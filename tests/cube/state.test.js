import { describe, it, expect } from 'vitest';
import { createSolvedState, isSolved, cloneState, getFace, FACE } from '../../src/cube/state.js';

describe('Cube State', () => {
  const SQUARE = 'BATOREWED';

  describe('createSolvedState', () => {
    it('creates a 54-element array', () => {
      const state = createSolvedState(SQUARE);
      expect(state).toHaveLength(54);
    });

    it('every face has the same 9 letters', () => {
      const state = createSolvedState(SQUARE);
      const expected = 'BATOREWED'.split('');
      for (let face = 0; face < 6; face++) {
        const faceStickers = state.slice(face * 9, face * 9 + 9);
        expect(faceStickers).toEqual(expected);
      }
    });

    it('converts to uppercase', () => {
      const state = createSolvedState('batorewed');
      expect(state[0]).toBe('B');
    });

    it('throws for wrong length', () => {
      expect(() => createSolvedState('BAT')).toThrow();
    });
  });

  describe('isSolved', () => {
    it('returns true for matching states', () => {
      const state = createSolvedState(SQUARE);
      const target = createSolvedState(SQUARE);
      expect(isSolved(state, target)).toBe(true);
    });

    it('returns false when one sticker differs', () => {
      const state = createSolvedState(SQUARE);
      const target = createSolvedState(SQUARE);
      state[0] = 'X';
      expect(isSolved(state, target)).toBe(false);
    });
  });

  describe('cloneState', () => {
    it('creates an independent copy', () => {
      const state = createSolvedState(SQUARE);
      const clone = cloneState(state);
      clone[0] = 'X';
      expect(state[0]).toBe('B');
      expect(clone[0]).toBe('X');
    });
  });

  describe('getFace', () => {
    it('extracts correct face data', () => {
      const state = createSolvedState(SQUARE);
      state[18] = 'X'; // modify F face first sticker
      const fFace = getFace(state, FACE.F);
      expect(fFace[0]).toBe('X');
      expect(fFace).toHaveLength(9);
    });
  });
});
