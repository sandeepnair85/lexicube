import { describe, it, expect, vi } from 'vitest';
import { createGameController } from '../../src/game/controller.js';

describe('Game Controller', () => {
  it('creates a game with correct properties', () => {
    const game = createGameController();
    expect(game.square).toHaveLength(9);
    expect(game.puzzleNumber).toBeGreaterThan(0);
    expect(game.moveTarget).toBeGreaterThanOrEqual(1);
    expect(game.moveTarget).toBeLessThanOrEqual(7);
    expect(game.moveCount).toBe(0);
    expect(game.isSolved).toBe(false);
  });

  it('current state differs from solved state (scrambled)', () => {
    const game = createGameController();
    // On some days with 1 move, they will differ
    expect(game.currentState).not.toEqual(game.solvedState);
  });

  it('making moves increments move count', () => {
    const game = createGameController();
    game.makeMove('U');
    expect(game.moveCount).toBe(1);
    game.makeMove("U'");
    expect(game.moveCount).toBe(2);
  });

  it('undo reverses the last move', () => {
    const game = createGameController();
    const before = game.currentState.slice();
    game.makeMove('R');
    expect(game.currentState).not.toEqual(before);
    game.undo();
    expect(game.currentState).toEqual(before);
    expect(game.moveCount).toBe(0);
  });

  it('reset returns to scrambled state', () => {
    const game = createGameController();
    const scrambled = game.currentState.slice();
    game.makeMove('U');
    game.makeMove('R');
    game.reset();
    expect(game.currentState).toEqual(scrambled);
    expect(game.moveCount).toBe(0);
  });

  it('getHint returns moves-away message', () => {
    const game = createGameController();
    const hint = game.getHint();
    expect(hint).not.toBeNull();
    expect(hint.message).toMatch(/moves? away/);
  });

  it('getHint shows distance after wrong moves', () => {
    const game = createGameController();
    game.makeMove('U');
    game.makeMove('R');
    const hint = game.getHint();
    expect(hint.message).toMatch(/moves? away/);
  });
});
