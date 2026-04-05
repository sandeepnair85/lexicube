import { describe, it, expect } from 'vitest';
import { validateFace, countValidWords } from '../../src/words/validator.js';

describe('Word Validator', () => {
  describe('validateFace', () => {
    it('validates a correct word square', () => {
      // HAY / ERA / NEW  (rows: hay, era, new; cols: hen, are, yaw)
      const face = 'HAYERANEW'.split('');
      const result = validateFace(face);
      expect(result.allValid).toBe(true);
      expect(result.rows[0].word).toBe('hay');
      expect(result.rows[1].word).toBe('era');
      expect(result.rows[2].word).toBe('new');
      expect(result.cols[0].word).toBe('hen');
      expect(result.cols[1].word).toBe('are');
      expect(result.cols[2].word).toBe('yaw');
    });

    it('detects invalid words in scrambled face', () => {
      const face = 'XYZABCDEF'.split('');
      const result = validateFace(face);
      expect(result.allValid).toBe(false);
    });

    it('partially valid face', () => {
      // Change one letter to break some words
      const face = 'BATORXWED'.split('');
      const result = validateFace(face);
      expect(result.rows[0].valid).toBe(true);  // BAT
      expect(result.rows[1].valid).toBe(false); // ORX - not a word
      expect(result.rows[2].valid).toBe(true);  // WED
      expect(result.allValid).toBe(false);
    });
  });

  describe('countValidWords', () => {
    it('counts 6 for a valid word square', () => {
      const face = 'HAYERANEW'.split('');
      expect(countValidWords(face)).toBe(6);
    });

    it('counts 0 for nonsense', () => {
      const face = 'XYZXYZXYZ'.split('');
      expect(countValidWords(face)).toBe(0);
    });
  });
});
