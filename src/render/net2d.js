/**
 * 2D unfolded net view of the cube.
 * Shows all 6 faces in a cross layout with word validity highlighting.
 */

import { FACE } from '../cube/state.js';
import { validateFace } from '../words/validator.js';

const FACE_LAYOUT = [
  // Row 0:  [empty] [U] [empty] [empty]
  [null, 'U', null, null],
  // Row 1:  [L] [F] [R] [B]
  ['L', 'F', 'R', 'B'],
  // Row 2:  [empty] [D] [empty] [empty]
  [null, 'D', null, null],
];

const FACE_CSS = {
  U: 'face-u', D: 'face-d', F: 'face-f',
  B: 'face-b', L: 'face-l', R: 'face-r',
};

const FACE_OFFSET = { U: 0, D: 9, F: 18, B: 27, L: 36, R: 45 };

/**
 * Creates the 2D net view.
 * @param {HTMLElement} container
 * @returns {{ update: Function, element: HTMLElement }}
 */
export function createNet2D(container) {
  const netDiv = document.createElement('div');
  netDiv.className = 'net-view';

  const cellElements = {}; // keyed by state index

  for (const row of FACE_LAYOUT) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'net-row';

    for (const faceName of row) {
      const faceDiv = document.createElement('div');
      faceDiv.className = 'net-face';

      if (!faceName) {
        faceDiv.classList.add('placeholder');
        // Add 9 invisible cells for spacing
        for (let i = 0; i < 9; i++) {
          const cell = document.createElement('div');
          cell.className = 'net-cell';
          cell.style.visibility = 'hidden';
          faceDiv.appendChild(cell);
        }
      } else {
        const offset = FACE_OFFSET[faceName];
        for (let i = 0; i < 9; i++) {
          const cell = document.createElement('div');
          cell.className = `net-cell ${FACE_CSS[faceName]}`;
          cellElements[offset + i] = cell;
          faceDiv.appendChild(cell);
        }
      }

      rowDiv.appendChild(faceDiv);
    }

    netDiv.appendChild(rowDiv);
  }

  container.appendChild(netDiv);

  function update(state) {
    // Update letters
    for (let i = 0; i < 54; i++) {
      if (cellElements[i]) {
        cellElements[i].textContent = state[i];
        cellElements[i].classList.remove('valid-word');
      }
    }

    // Highlight valid words on each face
    for (const [faceName, offset] of Object.entries(FACE_OFFSET)) {
      const faceState = state.slice(offset, offset + 9);
      const { rows, cols } = validateFace(faceState);

      // Highlight valid rows
      for (let r = 0; r < 3; r++) {
        if (rows[r].valid) {
          for (let c = 0; c < 3; c++) {
            cellElements[offset + r * 3 + c]?.classList.add('valid-word');
          }
        }
      }

      // Highlight valid columns
      for (let c = 0; c < 3; c++) {
        if (cols[c].valid) {
          for (let r = 0; r < 3; r++) {
            cellElements[offset + r * 3 + c]?.classList.add('valid-word');
          }
        }
      }
    }
  }

  function show() { netDiv.classList.add('visible'); }
  function hide() { netDiv.classList.remove('visible'); }

  return { element: netDiv, update, show, hide };
}
