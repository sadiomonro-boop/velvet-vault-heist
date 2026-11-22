// Keyboard + mouse input for Velvet Vault Heist.
// WASD/arrows move, Shift sneaks, click throws a smoke bomb at the cursor,
// 2 fires the EMP, R restarts, Enter starts / advances.

export function createInput(canvas, onSmokeAt, onEmp, onRestart, onConfirm) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, clicked: false };

  const MOVE_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ]);

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS.has(e.code) || e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Digit2') onEmp();
    if (e.code === 'KeyR') onRestart();
    if (e.code === 'Enter' || e.code === 'Space') onConfirm();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    mouse.x = x;
    mouse.y = y;
    onSmokeAt(x, y);
  });

  function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  return {
    moveVector,
    isSneaking: () => keys.has('ShiftLeft') || keys.has('ShiftRight'),
    mouse,
  };
}
