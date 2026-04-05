/**
 * Move input buttons — creates beginner-friendly controls for cube moves.
 */

const FACE_LABELS = {
  U: 'Top',
  D: 'Bottom',
  L: 'Left',
  R: 'Right',
  F: 'Front',
  B: 'Back',
};

/**
 * Creates move button controls.
 * @param {HTMLElement} container
 * @param {Function} onMove - callback(moveName) when a move button is clicked
 * @returns {{ element: HTMLElement, setEnabled: Function }}
 */
export function createMoveButtons(container, onMove) {
  const panel = document.createElement('div');
  panel.className = 'move-buttons';

  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];

  for (const face of faces) {
    const group = document.createElement('div');
    group.className = 'move-group';

    const label = document.createElement('div');
    label.className = 'move-label';
    label.textContent = FACE_LABELS[face];
    group.appendChild(label);

    const btnRow = document.createElement('div');
    btnRow.className = 'move-btn-row';

    const cwBtn = document.createElement('button');
    cwBtn.className = 'move-btn';
    cwBtn.innerHTML = '↻';
    cwBtn.title = `Rotate ${FACE_LABELS[face]} face clockwise`;
    cwBtn.addEventListener('click', () => onMove(face));

    const ccwBtn = document.createElement('button');
    ccwBtn.className = 'move-btn move-btn-prime';
    ccwBtn.innerHTML = '↺';
    ccwBtn.title = `Rotate ${FACE_LABELS[face]} face counter-clockwise`;
    ccwBtn.addEventListener('click', () => onMove(face + "'"));

    btnRow.appendChild(cwBtn);
    btnRow.appendChild(ccwBtn);
    group.appendChild(btnRow);
    panel.appendChild(group);
  }

  container.appendChild(panel);

  function setEnabled(val) {
    for (const btn of panel.querySelectorAll('.move-btn')) {
      btn.disabled = !val;
    }
  }

  return { element: panel, setEnabled };
}
