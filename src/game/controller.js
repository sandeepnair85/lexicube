/**
 * Game controller — orchestrates state, rendering, input, and win detection.
 */

import { createSolvedState, isSolved, cloneState, getFace } from '../cube/state.js';
import { applyMove, INVERSE_MOVE, applyMoves } from '../cube/moves.js';
import { generateScramble, invertScramble } from '../cube/scrambler.js';
import { getDailySquare, getPuzzleNumber } from '../words/squares.js';
import { validateFace } from '../words/validator.js';
import { dayName, scrambleMoves, dateString } from '../utils/date.js';

/**
 * Create the initial color state: each position has its face index.
 * 0=U, 1=D, 2=F, 3=B, 4=L, 5=R
 */
function createSolvedColorState() {
  const state = new Array(54);
  for (let face = 0; face < 6; face++) {
    for (let i = 0; i < 9; i++) {
      state[face * 9 + i] = face;
    }
  }
  return state;
}

export function createGameController() {
  const today = new Date();
  const square = getDailySquare(today);
  const puzzleNumber = getPuzzleNumber(today);
  const dayLabel = dayName(today);
  const moveTarget = scrambleMoves(today);

  // Build solved and scrambled states
  const solvedState = createSolvedState(square);
  const solvedColorState = createSolvedColorState();
  const { moves: scrambleMoveList } = generateScramble(today);
  const scrambledState = applyMoves(solvedState, scrambleMoveList);
  const scrambledColorState = applyMoves(solvedColorState, scrambleMoveList);

  // Game state
  let currentState = cloneState(scrambledState);
  let currentColorState = cloneState(scrambledColorState);
  let moveHistory = [];
  let solved = false;
  let startTime = null;
  let endTime = null;
  let hintsUsed = 0;

  // Callbacks
  let onStateChange = null;
  let onSolve = null;
  let onAutoSolve = null;

  const MAX_MOVES = 50;

  /**
   * Get rank title based on how many moves over par.
   */
  function getRank(movesMade, par) {
    const over = movesMade - par;
    if (over <= 0) return { title: 'Genius', emoji: '🧠' };
    if (over <= 2) return { title: 'Brilliant', emoji: '💎' };
    if (over <= 5) return { title: 'Great', emoji: '🔥' };
    if (over <= 10) return { title: 'Good', emoji: '👍' };
    if (over <= 20) return { title: 'Nice Try', emoji: '🙂' };
    return { title: 'Solved', emoji: '✅' };
  }

  function makeMove(move) {
    if (solved) return;
    if (!startTime) startTime = Date.now();

    currentState = applyMove(currentState, move);
    currentColorState = applyMove(currentColorState, move);
    moveHistory.push(move);

    if (isSolved(currentState, solvedState) && isSolved(currentColorState, solvedColorState)) {
      solved = true;
      endTime = Date.now();
      const rank = getRank(moveHistory.length, moveTarget);
      onSolve?.({
        moves: moveHistory.length,
        time: endTime - startTime,
        hints: hintsUsed,
        puzzleNumber,
        dayLabel,
        moveTarget,
        rank,
      });
    } else if (moveHistory.length >= MAX_MOVES) {
      // Auto-solve: apply the solution from current state
      solved = true;
      endTime = Date.now();
      const solution = invertScramble(scrambleMoveList);
      onAutoSolve?.({
        moves: moveHistory.length,
        time: endTime - startTime,
        hints: hintsUsed,
        puzzleNumber,
        dayLabel,
        moveTarget,
        solution,
      });
    }

    onStateChange?.(currentState, currentColorState, move);
    saveProgress();
  }

  function undo() {
    if (solved || moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    const inverse = INVERSE_MOVE[lastMove];
    currentState = applyMove(currentState, inverse);
    currentColorState = applyMove(currentColorState, inverse);
    onStateChange?.(currentState, currentColorState, null);
    saveProgress();
  }

  function reset() {
    currentState = cloneState(scrambledState);
    currentColorState = cloneState(scrambledColorState);
    moveHistory = [];
    solved = false;
    startTime = null;
    endTime = null;
    hintsUsed = 0;
    onStateChange?.(currentState, currentColorState, null);
    saveProgress();
  }

  /**
   * Estimate minimum moves from current state to solved.
   * Uses heuristic: count misplaced stickers. Each move changes
   * at most 21 stickers, so ceil(misplaced/8) is a practical estimate.
   * Exact for 0 (solved) and verified accurate for small distances.
   */
  function estimateMovesAway() {
    if (isSolved(currentColorState, solvedColorState)) return 0;

    // Count misplaced stickers using color state (unique per face)
    let misplaced = 0;
    for (let i = 0; i < 54; i++) {
      if (currentColorState[i] !== solvedColorState[i]) misplaced++;
    }

    // Each move affects ~21 stickers but typically fixes ~8 net.
    // Use ceil(misplaced / 8) as a practical estimate.
    const estimate = Math.ceil(misplaced / 8);

    // For small estimates, verify with quick IDA* on color state (up to depth 3)
    const searchMoves = ['U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'L', "L'", 'R', "R'"];
    if (estimate <= 3) {
      for (let d = 1; d <= 3; d++) {
        if (dfs(currentColorState, d, null)) return d;
      }
    }

    return estimate;

    function dfs(s, remaining, lastFace) {
      if (remaining === 0) return isSolved(s, solvedColorState);
      for (const move of searchMoves) {
        const face = move.endsWith("'") ? move.slice(0, -1) : move;
        if (face === lastFace) continue;
        if (dfs(applyMove(s, move), remaining - 1, face)) return true;
      }
      return false;
    }
  }

  function getHint() {
    if (solved) return null;
    hintsUsed++;

    const movesAway = estimateMovesAway();
    if (movesAway === 0) return { message: 'Already solved!' };
    if (movesAway === 1) return { message: '1 move away!' };
    return { message: `~${movesAway} moves away` };
  }

  function getElapsedTime() {
    if (!startTime) return 0;
    if (endTime) return endTime - startTime;
    return Date.now() - startTime;
  }

  // LocalStorage
  const STORAGE_KEY = `lexicube-${dateString(today)}`;

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        moveHistory, hintsUsed, solved, startTime, endTime,
      }));
    } catch (e) { /* ignore */ }
  }

  function loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return false;

      currentState = cloneState(scrambledState);
      currentColorState = cloneState(scrambledColorState);
      moveHistory = [];
      for (const move of data.moveHistory) {
        currentState = applyMove(currentState, move);
        currentColorState = applyMove(currentColorState, move);
        moveHistory.push(move);
      }
      hintsUsed = data.hintsUsed || 0;
      solved = data.solved || false;
      startTime = data.startTime || null;
      endTime = data.endTime || null;

      if (solved && !(isSolved(currentState, solvedState) && isSolved(currentColorState, solvedColorState))) {
        reset();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getShareText() {
    if (!solved) return null;
    const elapsed = endTime - startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

    const rank = getRank(moveHistory.length, moveTarget);
    const par = moveTarget;
    const over = moveHistory.length - par;
    const scoreText = over === 0 ? '🎯 Par!' : over > 0 ? `+${over} over par` : `${Math.abs(over)} under par!`;

    // Star rating: par=5 stars, +1=4, +2=3, +3=2, else=1
    const stars = Math.max(1, Math.min(5, 5 - over));
    const starStr = '⭐'.repeat(stars);

    // Difficulty bar using colored blocks
    const diffBar = '🟩'.repeat(moveTarget) + '⬛'.repeat(7 - moveTarget);

    return [
      `🧊 Lexicube #${puzzleNumber}`,
      `${dayLabel} | ${diffBar}`,
      ``,
      `🔄 ${moveHistory.length} moves (${scoreText})`,
      `⏱️ ${timeStr} | 💡 ${hintsUsed} hints`,
      `${starStr} ${rank.emoji} ${rank.title}`,
      ``,
      `https://sandeepnair85.github.io/lexicube`,
    ].join('\n');
  }

  return {
    get currentState() { return currentState; },
    get currentColorState() { return currentColorState; },
    get solvedState() { return solvedState; },
    get square() { return square; },
    get puzzleNumber() { return puzzleNumber; },
    get dayLabel() { return dayLabel; },
    get moveTarget() { return moveTarget; },
    get moveCount() { return moveHistory.length; },
    get isSolved() { return solved; },
    get hintsUsed() { return hintsUsed; },

    makeMove, undo, reset, getHint, getElapsedTime, getShareText, loadProgress,

    set onStateChange(fn) { onStateChange = fn; },
    set onSolve(fn) { onSolve = fn; },
    set onAutoSolve(fn) { onAutoSolve = fn; },
    getRank,
    get solution() { return invertScramble(scrambleMoveList); },
  };
}
