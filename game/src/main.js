// Bootstrap for Velvet Vault Heist: wires the canvas, input, sound and
// the game loop together. A ?shot=1..4 query starts a staged mid-heist
// scene so the maker can screenshot the game in action.

import { createGame } from './game.js';
import { createInput } from './input.js';
import { createSound } from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const sound = createSound();
const game = createGame((event, value) => {
  if (event === 'pickup') sound.pickup();
  else if (event === 'bigLoot') sound.bigLoot();
  else if (event === 'smoke') sound.smoke();
  else if (event === 'emp') sound.emp();
  else if (event === 'caught') { sound.caught(); sound.setAlarmLevel(0); }
  else if (event === 'getaway') sound.getaway();
  else if (event === 'alarm') sound.setAlarmLevel(value);
});

const input = createInput(
  canvas,
  (x, y) => { sound.unlock(); game.throwSmoke(x, y); },
  () => { sound.unlock(); game.fireEmp(); },
  () => { sound.unlock(); game.restartRoom(); },
  () => { sound.unlock(); game.confirm(); },
);
canvas.addEventListener('mousedown', () => {
  if (game.state.state === 'title') game.confirm();
});

// Staged screenshot scenes (?shot=1..4). Otherwise the title screen shows.
const params = new URLSearchParams(window.location.search);
const shot = Number(params.get('shot') || 0);
if (shot >= 1 && shot <= 4) game.applyShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const move = input.moveVector();
  game.update(dt, { x: move.x, y: move.y, sneaking: input.isSneaking() });
  render(ctx, game.state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
