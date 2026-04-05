import { describe, it, expect } from 'vitest';
import { generateScramble, invertScramble } from '../../src/cube/scrambler.js';
import { applyMoves } from '../../src/cube/moves.js';
import { createSolvedState, isSolved } from '../../src/cube/state.js';
import { MOVE_FACE, FACE_AXIS } from '../../src/cube/moves.js';

describe('Scrambler', () => {
  describe('determinism', () => {
    it('same date produces same scramble', () => {
      const date = new Date('2026-04-05');
      const s1 = generateScramble(date);
      const s2 = generateScramble(date);
      expect(s1.moves).toEqual(s2.moves);
      expect(s1.seed).toEqual(s2.seed);
    });

    it('different dates produce different scrambles', () => {
      const s1 = generateScramble(new Date('2026-04-05'));
      const s2 = generateScramble(new Date('2026-04-06'));
      // They could theoretically be the same, but with different seeds it's extremely unlikely
      expect(s1.seed).not.toEqual(s2.seed);
    });
  });

  describe('move count by day of week', () => {
    // Monday 2026-04-06 = 1 move
    it('Monday = 1 move', () => {
      const s = generateScramble(new Date('2026-04-06'));
      expect(s.moves).toHaveLength(1);
    });

    // Tuesday 2026-04-07 = 2 moves
    it('Tuesday = 2 moves', () => {
      const s = generateScramble(new Date('2026-04-07'));
      expect(s.moves).toHaveLength(2);
    });

    // Sunday 2026-04-05 = 7 moves
    it('Sunday = 7 moves', () => {
      const s = generateScramble(new Date('2026-04-05'));
      expect(s.moves).toHaveLength(7);
    });
  });

  describe('no consecutive same-face moves', () => {
    it('100 random dates have no consecutive same-face', () => {
      for (let d = 0; d < 100; d++) {
        const date = new Date(2026, 0, 1 + d);
        const { moves } = generateScramble(date);
        for (let i = 1; i < moves.length; i++) {
          const face1 = MOVE_FACE[moves[i - 1]];
          const face2 = MOVE_FACE[moves[i]];
          expect(face2, `Day ${d}: ${moves.join(' ')}`).not.toEqual(face1);
        }
      }
    });
  });

  describe('no opposite-face-axis three-peat', () => {
    it('100 random dates have no axis three-peat', () => {
      for (let d = 0; d < 100; d++) {
        const date = new Date(2026, 0, 1 + d);
        const { moves } = generateScramble(date);
        for (let i = 2; i < moves.length; i++) {
          const axis0 = FACE_AXIS[MOVE_FACE[moves[i - 2]]];
          const axis1 = FACE_AXIS[MOVE_FACE[moves[i - 1]]];
          const axis2 = FACE_AXIS[MOVE_FACE[moves[i]]];
          if (axis0 === axis1) {
            expect(axis2, `Day ${d}: ${moves.join(' ')}`).not.toEqual(axis0);
          }
        }
      }
    });
  });

  describe('inverse scramble solves the cube', () => {
    it('applying scramble then inverse returns to solved', () => {
      const solved = createSolvedState('BATOREWED');
      for (let d = 0; d < 30; d++) {
        const date = new Date(2026, 0, 1 + d);
        const { moves } = generateScramble(date);
        const scrambled = applyMoves(solved, moves);
        const inverseMoves = invertScramble(moves);
        const unscrambled = applyMoves(scrambled, inverseMoves);
        expect(isSolved(unscrambled, solved), `Day ${d}`).toBe(true);
      }
    });
  });
});
