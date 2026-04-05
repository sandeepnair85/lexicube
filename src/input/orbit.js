/**
 * Orbit controls — drag to rotate the cube view.
 */

export function setupOrbitControls(viewport, cubeRenderer) {
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  function onPointerDown(e) {
    // Only drag on empty space (not on stickers/buttons)
    if (e.target.closest('.sticker') || e.target.closest('button')) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const { x, y } = cubeRenderer.getOrbit();
    const newX = Math.max(-89, Math.min(89, x - dy * 0.5));
    const newY = y + dx * 0.5;
    cubeRenderer.setOrbit(newX, newY);
  }

  function onPointerUp() {
    isDragging = false;
    viewport.style.cursor = 'grab';
  }

  viewport.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  viewport.style.cursor = 'grab';
  viewport.style.touchAction = 'none';

  return function cleanup() {
    viewport.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };
}
