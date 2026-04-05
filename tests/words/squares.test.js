import { describe, it, expect } from 'vitest';
import { generateAllSquares, getDailySquare, getPuzzleNumber } from '../../src/words/squares.js';
import { isValidWord } from '../../src/words/dictionary.js';

describe('Word Squares', () => {
  describe('generateAllSquares', () => {
    it('generates a large number of squares', () => {
      const squares = generateAllSquares();
      expect(squares.length).toBeGreaterThan(1000);
    });

    it('every square has valid rows and columns', () => {
      const squares = generateAllSquares();
      // Check a random sample of 200 squares
      const sample = squares.filter((_, i) => i % Math.floor(squares.length / 200) === 0);
      for (const sq of sample) {
        expect(sq).toHaveLength(9);
        const row0 = sq.slice(0, 3).toLowerCase();
        const row1 = sq.slice(3, 6).toLowerCase();
        const row2 = sq.slice(6, 9).toLowerCase();
        const col0 = (sq[0] + sq[3] + sq[6]).toLowerCase();
        const col1 = (sq[1] + sq[4] + sq[7]).toLowerCase();
        const col2 = (sq[2] + sq[5] + sq[8]).toLowerCase();

        expect(isValidWord(row0), `Row "${row0}" in square "${sq}"`).toBe(true);
        expect(isValidWord(row1), `Row "${row1}" in square "${sq}"`).toBe(true);
        expect(isValidWord(row2), `Row "${row2}" in square "${sq}"`).toBe(true);
        expect(isValidWord(col0), `Col "${col0}" in square "${sq}"`).toBe(true);
        expect(isValidWord(col1), `Col "${col1}" in square "${sq}"`).toBe(true);
        expect(isValidWord(col2), `Col "${col2}" in square "${sq}"`).toBe(true);
      }
    });

    it('all squares are uppercase', () => {
      const squares = generateAllSquares();
      for (const sq of squares.slice(0, 100)) {
        expect(sq).toBe(sq.toUpperCase());
      }
    });
  });

  describe('getDailySquare', () => {
    it('returns same square for same date', () => {
      const date = new Date('2026-04-05');
      const s1 = getDailySquare(date);
      const s2 = getDailySquare(date);
      expect(s1).toBe(s2);
    });

    it('returns different squares for different dates', () => {
      const s1 = getDailySquare(new Date('2026-04-05'));
      const s2 = getDailySquare(new Date('2026-04-06'));
      // Could theoretically be same, but very unlikely with 24k+ squares
      expect(s1).not.toBe(s2);
    });

    it('returns a valid 9-char string', () => {
      const sq = getDailySquare(new Date('2026-06-15'));
      expect(sq).toHaveLength(9);
      expect(sq).toBe(sq.toUpperCase());
    });
  });

  describe('getPuzzleNumber', () => {
    it('returns 1 for epoch date', () => {
      expect(getPuzzleNumber(new Date('2026-04-05'))).toBe(1);
    });

    it('increments by date', () => {
      const n1 = getPuzzleNumber(new Date('2026-04-05'));
      const n2 = getPuzzleNumber(new Date('2026-04-06'));
      expect(n2 - n1).toBe(1);
    });
  });
});
