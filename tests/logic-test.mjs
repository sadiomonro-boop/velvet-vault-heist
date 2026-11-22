// Node logic tests for Velvet Vault Heist — no browser needed.
// Run: node tests/logic-test.mjs  (exit 0 = all pass)
// Covers: per-level loot + exit reachability from the real player start
// (BFS over walkable floor, thief radius 15), guard routes clear of every
// solid, loot never inside a solid, and the live rules — loot pickup +100,
// exit levelclear +50, caught at alarm 100, smoke $15, EMP $25 + camera
// disable, and the staged ?shot= tableaus surviving update().

import { LEVELS, TUNING } from '../game/src/config.js';
import { createGame } from '../game/src/game.js';
import { segmentHitsRect, pointInCone, hasLineOfSight, guardSeesThief } from '../game/src/guards.js';

const SOLID = new Set(['wall', 'case', 'pillar', 'desk', 'plant']);
const ZERO = { x: 0, y: 0, sneaking: false };

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log('PASS  ' + name); }
  else { failed++; console.log('FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}

function circleHitsSolid(cx, cy, r, walls) {
  for (const w of walls) {
    if (!SOLID.has(w.kind)) continue;
    const nx = Math.max(w.x, Math.min(cx, w.x + w.w));
    const ny = Math.max(w.y, Math.min(cy, w.y + w.h));
    const dx = cx - nx;
    const dy = cy - ny;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// BFS over walkable floor cells (10 px grid, thief radius 15) from the
// level's real player start. Returns the set of reachable "x,y" keys.
function reachableCells(level) {
  const step = 10;
  const key = (x, y) => x + ',' + y;
  const start = level.playerStart;
  const sx = Math.round(start.x / step) * step;
  const sy = Math.round(start.y / step) * step;
  const seen = new Set();
  const queue = [];
  // The start itself must be walkable; otherwise take the nearest cell.
  if (!circleHitsSolid(sx, sy, TUNING.thiefRadius, level.walls)) {
    queue.push([sx, sy]);
    seen.add(key(sx, sy));
  } else {
    outer:
    for (let r = 0; r < 200; r += step) {
      for (let dx = -r; dx <= r; dx += step) {
        for (let dy = -r; dy <= r; dy += step) {
          if (Math.abs(dx) + Math.abs(dy) !== r) continue;
          const x = sx + dx;
          const y = sy + dy;
          if (x < 41 || x > 1239 || y < 41 || y > 679) continue;
          if (!circleHitsSolid(x, y, TUNING.thiefRadius, level.walls)) {
            queue.push([x, y]);
            seen.add(key(x, y));
            break outer;
          }
        }
      }
    }
  }
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 41 || nx > 1239 || ny < 41 || ny > 679) continue;
      if (seen.has(key(nx, ny))) continue;
      if (circleHitsSolid(nx, ny, TUNING.thiefRadius, level.walls)) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  return seen;
}

function nearestReachableDist(cells, px, py) {
  let best = Infinity;
  for (const k of cells) {
    const [x, y] = k.split(',').map(Number);
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  return best;
}

// ---- Per-level reachability + layout hygiene ----
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const tag = 'level ' + (i + 1) + ' (' + lv.name + ')';
  const cells = reachableCells(lv);

  const lootInSolid = lv.walls.some((w) => SOLID.has(w.kind) &&
    lv.loot.x >= w.x && lv.loot.x <= w.x + w.w && lv.loot.y >= w.y && lv.loot.y <= w.y + w.h);
  check(tag + ': main loot not inside any solid', !lootInSolid,
    'loot at (' + lv.loot.x + ',' + lv.loot.y + ')');

  const lootDist = nearestReachableDist(cells, lv.loot.x, lv.loot.y);
  check(tag + ': main loot reachable (nearest walkable point < 34 px)', lootDist < 34,
    'nearest reachable point ' + lootDist.toFixed(1) + ' px away');

  const e = lv.exit;
  let exitOk = false;
  for (const k of cells) {
    const [x, y] = k.split(',').map(Number);
    if (x > e.x - 10 && x < e.x + e.w + 10 && y > e.y - 10 && y < e.y + e.h + 10) { exitOk = true; break; }
  }
  check(tag + ': exit reachable after loot', exitOk);

  for (const c of lv.smallLoot) {
    const d = nearestReachableDist(cells, c.x, c.y);
    check(tag + ': small loot (' + c.x + ',' + c.y + ') reachable', d < 26,
      'nearest reachable point ' + d.toFixed(1) + ' px away');
  }

  for (let gi = 0; gi < lv.guards.length; gi++) {
    const wps = lv.guards[gi].waypoints;
    let wpOk = true;
    let wpBad = '';
    for (const wp of wps) {
      for (const w of lv.walls) {
        if (!SOLID.has(w.kind)) continue;
        if (wp.x >= w.x && wp.x <= w.x + w.w && wp.y >= w.y && wp.y <= w.y + w.h) {
          wpOk = false;
          wpBad = 'waypoint (' + wp.x + ',' + wp.y + ') inside ' + w.kind;
        }
      }
    }
    check(tag + ': guard ' + (gi + 1) + ' waypoints clear of solids', wpOk, wpBad);
    let segOk = true;
    let segBad = '';
    for (let k = 0; k < wps.length; k++) {
      const a = wps[k];
      const b = wps[(k + 1) % wps.length];
      for (const w of lv.walls) {
        if (!SOLID.has(w.kind)) continue;
        if (segmentHitsRect(a.x, a.y, b.x, b.y, w)) {
          segOk = false;
          segBad = 'leg (' + a.x + ',' + a.y + ')-(' + b.x + ',' + b.y + ') crosses ' + w.kind;
        }
      }
    }
    check(tag + ': guard ' + (gi + 1) + ' patrol legs clear of solids', segOk, segBad);
  }
}

// ---- Live rules: full playthrough of all 3 rooms ----
{
  const game = createGame(() => {});
  const s = game.state;
  game.start();
  check('rules: start puts thief at room 1 start', s.thief.x === 90 && s.thief.y === 600);

  for (let i = 0; i < LEVELS.length; i++) {
    const lv = LEVELS[i];
    s.thief = { x: lv.loot.x, y: lv.loot.y };
    const before = s.score;
    game.update(0.016, ZERO);
    check('rules: room ' + (i + 1) + ' loot pickup +100', s.lootTaken && s.score === before + 100,
      'score ' + s.score + ' (was ' + before + ')');
    const e = lv.exit;
    s.thief = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
    game.update(0.016, ZERO);
    check('rules: room ' + (i + 1) + ' exit gives levelclear +50', s.state === 'levelclear' && s.score === before + 150,
      'state ' + s.state + ', score ' + s.score);
    game.confirm();
  }
  check('rules: all 3 rooms clear -> won, score 450', s.state === 'won' && s.score === 450,
    'state ' + s.state + ', score ' + s.score);
}

// ---- Caught at alarm 100 (guard stares the thief down) ----
{
  const game = createGame(() => {});
  const s = game.state;
  game.start();
  const g = s.guards[0];
  g.pauseLeft = 10; // hold the guard still, facing east
  g.angle = 0;
  g.x = 200;
  g.y = 200;
  s.thief = { x: 280, y: 200 };
  s.alarm = 99;
  let caught = false;
  for (let k = 0; k < 40; k++) {
    game.update(0.05, ZERO);
    if (s.state === 'caught') { caught = true; break; }
  }
  check('rules: alarm reaching 100 catches the thief', caught, 'state ' + s.state);
}

// ---- Tools: smoke $15, EMP $25 + camera disable ----
{
  const game = createGame(() => {});
  const s = game.state;
  game.start();
  s.score = 40;
  game.throwSmoke(500, 500);
  check('rules: smoke costs $15', s.score === 25 && s.smokes.length === 1,
    'score ' + s.score + ', smokes ' + s.smokes.length);
  game.fireEmp();
  check('rules: EMP costs $25 and disables cameras', s.score === 0 &&
    s.cameras.every((c) => c.disabledLeft > 0), 'score ' + s.score);
}

// ---- Staged shots survive update() ----
{
  const game = createGame(() => {});
  const s = game.state;
  game.applyShot(2);
  for (let k = 0; k < 10; k++) game.update(0.05, ZERO);
  check('shot 2: staged sneak ring survives update()', s.sneaking === true && s.alarm === 18,
    'sneaking ' + s.sneaking + ', alarm ' + s.alarm);

  game.applyShot(3);
  const g0 = s.guards[0];
  const genuinelySeen = guardSeesThief(g0, s.thief, s.level.walls, s.smokes,
    TUNING.guardConeRange, TUNING.guardConeHalfAngle);
  const inCone = pointInCone(s.thief.x, s.thief.y, g0.x, g0.y, g0.angle,
    TUNING.guardConeRange, TUNING.guardConeHalfAngle);
  const los = hasLineOfSight(g0.x, g0.y, s.thief.x, s.thief.y, s.level.walls);
  check('shot 3: thief genuinely inside guard 0 cone', inCone,
    'thief (' + s.thief.x + ',' + s.thief.y + '), guard (' + g0.x + ',' + g0.y + ') angle ' + g0.angle.toFixed(2));
  check('shot 3: clear line of sight guard -> thief', los);
  check('shot 3: guard genuinely sees the thief', genuinelySeen);
  for (let k = 0; k < 20; k++) game.update(0.05, ZERO);
  check('shot 3: SPOTTED state survives update() (no flip to caught)', s.seenBy === 'guard' &&
    s.guards[0].alerted === true && s.state === 'playing' && s.alarm === 88,
    'seenBy ' + s.seenBy + ', alerted ' + s.guards[0].alerted + ', state ' + s.state + ', alarm ' + s.alarm);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
