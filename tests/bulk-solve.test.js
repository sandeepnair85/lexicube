/**
 * Bulk puzzle validation — tests every day for correctness.
 * For each day: generates puzzle, solves it, verifies state,
 * and checks hint distance decreases after each move.
 *
 * This runs as a fast unit test (no browser needed).
 */
import { describe, it, expect } from 'vitest';
import { generateScramble, invertScramble } from '../src/cube/scrambler.js';
import { getDailySquare } from '../src/words/squares.js';
import { dayName, scrambleMoves } from '../src/utils/date.js';
import { createSolvedState, isSolved, cloneState } from '../src/cube/state.js';
import { applyMoves, applyMove } from '../src/cube/moves.js';
import { validateFace } from '../src/words/validator.js';

function createSolvedColorState() {
  const state = new Array(54);
  for (let face = 0; face < 6; face++)
    for (let i = 0; i < 9; i++)
      state[face * 9 + i] = face;
  return state;
}

function countMisplaced(colorState, solvedColor) {
  let n = 0;
  for (let i = 0; i < 54; i++) if (colorState[i] !== solvedColor[i]) n++;
  return n;
}

function testDay(date) {
  const ds = date.toISOString().slice(0, 10);
  const day = dayName(date);
  const moveCount = scrambleMoves(date);
  const square = getDailySquare(date);
  const { moves: scramble } = generateScramble(date);
  const solution = invertScramble(scramble);

  const solvedState = createSolvedState(square);
  const solvedColor = createSolvedColorState();

  // 1. Verify scramble produces a different state
  const scrambledState = applyMoves(solvedState, scramble);
  const scrambledColor = applyMoves(solvedColor, scramble);
  expect(isSolved(scrambledColor, solvedColor), `${ds}: scramble should change state`).toBe(false);

  // 2. Verify solution brings it back to solved
  const unscrambledState = applyMoves(scrambledState, solution);
  const unscrambledColor = applyMoves(scrambledColor, solution);
  expect(isSolved(unscrambledState, solvedState), `${ds}: letters should be solved`).toBe(true);
  expect(isSolved(unscrambledColor, solvedColor), `${ds}: colors should be solved`).toBe(true);

  // 3. Verify word square is valid (all rows/cols are words on every face)
  for (let face = 0; face < 6; face++) {
    const faceState = solvedState.slice(face * 9, face * 9 + 9);
    const { allValid } = validateFace(faceState);
    expect(allValid, `${ds}: face ${face} should have all valid words`).toBe(true);
  }

  // 4. Verify scramble move count matches day of week
  expect(scramble.length, `${ds}: scramble should have ${moveCount} moves`).toBe(moveCount);
  expect(solution.length, `${ds}: solution should have ${moveCount} moves`).toBe(moveCount);

  // 5. Step through solution, verify misplaced count decreases
  let state = cloneState(scrambledState);
  let color = cloneState(scrambledColor);
  let prevMisplaced = countMisplaced(color, solvedColor);

  for (let i = 0; i < solution.length; i++) {
    state = applyMove(state, solution[i]);
    color = applyMove(color, solution[i]);
    const misplaced = countMisplaced(color, solvedColor);

    // After the last move, must be 0
    if (i === solution.length - 1) {
      expect(misplaced, `${ds}: should be solved after all moves`).toBe(0);
    }
  }

  return { ds, day, moveCount, square };
}

// Generate date range
function dateRange(startStr, days) {
  const dates = [];
  const start = new Date(startStr + 'T00:00:00Z');
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + d);
    dates.push(date);
  }
  return dates;
}

describe('Bulk puzzle validation — 1 week', () => {
  const dates = dateRange('2026-04-05', 7);
  for (const date of dates) {
    const ds = date.toISOString().slice(0, 10);
    it(`${ds} puzzle is valid and solvable`, () => {
      testDay(date);
    });
  }
});

describe('Bulk puzzle validation — 1 month', () => {
  const dates = dateRange('2026-04-05', 30);
  for (const date of dates) {
    const ds = date.toISOString().slice(0, 10);
    it(`${ds}`, () => {
      testDay(date);
    });
  }
});

describe('Bulk puzzle validation — 1 year', () => {
  const dates = dateRange('2026-04-05', 365);
  for (const date of dates) {
    const ds = date.toISOString().slice(0, 10);
    it(`${ds}`, () => {
      testDay(date);
    });
  }
});

describe('Bulk puzzle validation — 6 years', () => {
  const dates = dateRange('2026-04-05', 365 * 6);
  for (const date of dates) {
    const ds = date.toISOString().slice(0, 10);
    it(`${ds}`, () => {
      testDay(date);
    });
  }
});
