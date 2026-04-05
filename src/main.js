/**
 * Lexicube — main entry point.
 */

import './styles/main.css';
import './styles/cube.css';
import './styles/net.css';
import './styles/ui.css';

import { createGameController } from './game/controller.js';
import { createCube3D } from './render/cube3d.js';
import { createNet2D } from './render/net2d.js';
import { createMoveButtons } from './input/moves-input.js';

function init() {
  const game = createGameController();

  // --- Header ---
  document.getElementById('puzzle-number').textContent = `#${game.puzzleNumber}`;
  document.getElementById('day-label').textContent = game.dayLabel;
  document.getElementById('difficulty').textContent = `${game.moveTarget}-move puzzle`;

  // --- Target display ---
  const targetGrid = document.getElementById('target-grid');
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'target-cell';
    cell.textContent = game.square[i];
    targetGrid.appendChild(cell);
  }

  // --- Shared move handler ---
  let animating = false;

  function doMove(move) {
    if (animating || game.isSolved) return;
    animating = true;
    moveButtons.setEnabled(false);
    cube3d.setAnimating(true);

    game.makeMove(move);

    cube3d.animateMove(move, game.currentState, game.currentColorState, 200).then(() => {
      animating = false;
      cube3d.setAnimating(false);
      if (!game.isSolved) {
        moveButtons.setEnabled(true);
      }
      net2d.update(game.currentState);
      updateStats();
    });
  }

  // --- 3D Cube (with drag-on-face move callback) ---
  const cubeContainer = document.getElementById('cube-container');
  const cube3d = createCube3D(cubeContainer, doMove);

  // --- 2D Net ---
  const netContainer = document.getElementById('net-container');
  const net2d = createNet2D(netContainer);

  // --- Move buttons (fallback for those who prefer buttons) ---
  const moveContainer = document.getElementById('move-buttons-container');
  const moveButtons = createMoveButtons(moveContainer, doMove);

  // --- View toggle ---
  let view3D = true;
  const viewToggle = document.getElementById('view-toggle');
  viewToggle.addEventListener('click', () => {
    view3D = !view3D;
    cube3d.element.style.display = view3D ? '' : 'none';
    if (view3D) {
      net2d.hide();
    } else {
      net2d.show();
      net2d.update(game.currentState);
    }
    viewToggle.textContent = view3D ? '2D View' : '3D View';
  });

  // --- Undo ---
  document.getElementById('undo-btn').addEventListener('click', () => {
    if (animating) return;
    game.undo();
    cube3d.updateLetters(game.currentState, game.currentColorState);
    net2d.update(game.currentState);
    updateStats();
  });

  // --- Reset ---
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (animating) return;
    if (game.moveCount > 0 && !confirm('Reset puzzle? Your progress will be lost.')) return;
    game.reset();
    cube3d.updateLetters(game.currentState, game.currentColorState);
    net2d.update(game.currentState);
    moveButtons.setEnabled(true);
    updateStats();
    hideBanner();
  });

  // --- Hints (shows how many moves away from solved) ---
  document.getElementById('hint-btn').addEventListener('click', () => {
    if (animating) return;
    const hint = game.getHint();
    if (hint) {
      showToast(hint.message);
    }
  });

  // --- Share ---
  document.getElementById('share-btn').addEventListener('click', () => {
    const text = game.getShareText();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
      }).catch(() => {
        showToast('Could not copy');
      });
    }
  });

  // --- Help modal ---
  const helpModal = document.getElementById('help-modal');
  document.getElementById('help-btn').addEventListener('click', () => {
    helpModal.classList.add('visible');
  });
  document.getElementById('close-help').addEventListener('click', () => {
    helpModal.classList.remove('visible');
  });
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.remove('visible');
  });

  // Show tutorial on first visit
  if (!localStorage.getItem('lexicube-tutorial-seen')) {
    helpModal.classList.add('visible');
    localStorage.setItem('lexicube-tutorial-seen', '1');
  }

  // --- State change handler (for undo/reset direct updates) ---
  game.onStateChange = (state, colorState, move) => {
    if (!move) {
      cube3d.updateLetters(state, colorState);
    }
    net2d.update(state);
    updateStats();
  };

  // --- Win handler ---
  game.onSolve = (result) => {
    moveButtons.setEnabled(false);
    showBanner(result);
  };

  // --- Auto-solve handler (after 50 moves) ---
  const MOVE_LABELS = {
    U: 'Top ↻', "U'": 'Top ↺', D: 'Bottom ↻', "D'": 'Bottom ↺',
    L: 'Left ↻', "L'": 'Left ↺', R: 'Right ↻', "R'": 'Right ↺',
    F: 'Front ↻', "F'": 'Front ↺', B: 'Back ↻', "B'": 'Back ↺',
  };

  game.onAutoSolve = (result) => {
    moveButtons.setEnabled(false);
    const banner = document.getElementById('auto-solve-banner');
    banner.querySelector('.auto-moves').textContent = result.moves;
    banner.querySelector('.auto-par').textContent = result.moveTarget;

    const stepsDiv = document.getElementById('solution-steps');
    stepsDiv.innerHTML = '';
    result.solution.forEach((move, i) => {
      const step = document.createElement('div');
      step.className = 'solution-step';
      step.textContent = `${i + 1}. ${MOVE_LABELS[move] || move}`;
      stepsDiv.appendChild(step);
    });

    banner.classList.add('visible');
  };

  // --- Stats ---
  function updateStats() {
    document.getElementById('move-count').textContent = game.moveCount;
    document.getElementById('hint-count').textContent = game.hintsUsed;
    document.getElementById('optimal-moves').textContent = game.moveTarget;
  }

  function showBanner(result) {
    const banner = document.getElementById('win-banner');
    const elapsed = result.time;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

    const par = result.moveTarget;
    const over = result.moves - par;
    const scoreText = over === 0 ? 'Par!' : over > 0 ? `+${over} over` : `${Math.abs(over)} under`;
    const rank = result.rank;

    banner.querySelector('.win-rank-emoji').textContent = rank.emoji;
    banner.querySelector('.win-rank-title').textContent = rank.title + '!';
    banner.querySelector('.win-moves').textContent = result.moves;
    banner.querySelector('.win-par').textContent = `${par}-move puzzle`;
    banner.querySelector('.win-score').textContent = scoreText;
    banner.querySelector('.win-time').textContent = timeStr;
    banner.querySelector('.win-hints').textContent = result.hints;
    banner.classList.add('visible');
  }

  function hideBanner() {
    document.getElementById('win-banner').classList.remove('visible');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  // --- Load saved progress ---
  game.loadProgress();
  cube3d.updateLetters(game.currentState, game.currentColorState);
  net2d.update(game.currentState);
  updateStats();

  if (game.isSolved) {
    moveButtons.setEnabled(false);
    showBanner({
      moves: game.moveCount,
      time: game.getElapsedTime(),
      hints: game.hintsUsed,
      moveTarget: game.moveTarget,
      rank: game.getRank(game.moveCount, game.moveTarget),
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
