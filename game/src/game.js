// Game state and rules for Velvet Vault Heist.
// One thief, patrolling guards, sweeping cameras, one big loot per room
// plus small coins, tools that cost loot, an alarm meter, and a getaway
// door that only opens once the room's treasure is lifted.

import { LEVELS, TUNING } from './config.js';
import { createGuard, updateGuard, guardSeesThief } from './guards.js';
import { createCamera, updateCamera, cameraSeesThief } from './cameras.js';

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Ropes are low cover: they block sight but the thief steps over them.
const SOLID_KINDS = new Set(['wall', 'case', 'pillar', 'desk', 'plant']);

export function createGame(onEvent) {
  const s = {
    state: 'title', // title | playing | caught | levelclear | won
    levelIndex: 0,
    level: LEVELS[0],
    guards: [],
    cameras: [],
    thief: { x: 90, y: 600 },
    alarm: 0,
    score: 0,
    lootTaken: false,
    smokes: [],
    sneaking: false,
    seenBy: null,
    time: 0,
    onEvent,
  };

  function loadLevel(i) {
    s.levelIndex = i;
    s.level = LEVELS[i];
    s.guards = s.level.guards.map((g) => createGuard(g, TUNING.guardSpeed));
    s.cameras = s.level.cameras.map((c) => createCamera(c));
    s.thief = { x: s.level.playerStart.x, y: s.level.playerStart.y };
    s.alarm = 0;
    s.lootTaken = false;
    s.smokes = [];
    s.seenBy = null;
    for (const c of s.level.smallLoot) c.taken = false;
  }

  function start() {
    s.score = 0;
    loadLevel(0);
    s.state = 'playing';
  }

  function restartRoom() {
    loadLevel(s.levelIndex);
    s.state = 'playing';
  }

  function nextLevel() {
    if (s.levelIndex + 1 >= LEVELS.length) {
      s.state = 'won';
      s.onEvent('getaway');
      return;
    }
    loadLevel(s.levelIndex + 1);
    s.state = 'playing';
  }

  function moveThief(dx, dy, dt) {
    const speed = s.sneaking ? TUNING.sneakSpeed : TUNING.thiefSpeed;
    const nx = s.thief.x + dx * speed * dt;
    const ny = s.thief.y + dy * speed * dt;
    const r = TUNING.thiefRadius;
    const walls = s.level.walls;
    // Axis-separated movement so the thief slides along cover.
    let blocked = false;
    for (const w of walls) if (SOLID_KINDS.has(w.kind) && circleHitsRect(nx, s.thief.y, r, w)) { blocked = true; break; }
    if (!blocked) s.thief.x = Math.max(26 + r, Math.min(1280 - 26 - r, nx));
    blocked = false;
    for (const w of walls) if (SOLID_KINDS.has(w.kind) && circleHitsRect(s.thief.x, ny, r, w)) { blocked = true; break; }
    if (!blocked) s.thief.y = Math.max(26 + r, Math.min(720 - 26 - r, ny));
  }

  function throwSmoke(x, y) {
    if (s.state !== 'playing') return;
    if (s.score < TUNING.smokeCost) return;
    s.score -= TUNING.smokeCost;
    s.smokes.push({ x, y, r: 70, left: TUNING.smokeSeconds });
    s.onEvent('smoke');
  }

  function fireEmp() {
    if (s.state !== 'playing') return;
    if (s.score < TUNING.empCost) return;
    let any = false;
    for (const c of s.cameras) {
      if (c.disabledLeft <= 0) { c.disabledLeft = TUNING.empSeconds; any = true; }
    }
    if (!any) return;
    s.score -= TUNING.empCost;
    s.onEvent('emp');
  }

  function confirm() {
    if (s.state === 'title') start();
    else if (s.state === 'levelclear') nextLevel();
  }

  // Staged scenes for the maker's screenshots — real renders of this code
  // with the thief placed mid-heist. Normal play never uses ?shot=.
  function applyShot(n) {
    if (n === 1) {
      loadLevel(0);
      s.state = 'playing';
      s.thief = { x: 470, y: 430 };
      s.alarm = 34;
      s.score = 40;
    } else if (n === 2) {
      loadLevel(1);
      s.state = 'playing';
      s.thief = { x: 430, y: 430 };
      s.sneaking = true;
      s.alarm = 18;
      s.score = 120;
      s.smokes.push({ x: 520, y: 400, r: 70, left: 4 });
    } else if (n === 3) {
      loadLevel(0);
      s.state = 'playing';
      s.thief = { x: 760, y: 200 };
      s.alarm = 88;
      s.score = 60;
      s.guards[0].alerted = true;
      s.seenBy = 'guard';
    } else if (n === 4) {
      loadLevel(2);
      s.state = 'playing';
      s.thief = { x: 1120, y: 130 };
      s.lootTaken = true;
      s.alarm = 12;
      s.score = 310;
    }
  }

  function update(dt, move) {
    s.time += dt;
    if (s.state !== 'playing') return;
    s.sneaking = move.sneaking;
    if (move.x !== 0 || move.y !== 0) moveThief(move.x, move.y, dt);

    for (const g of s.guards) updateGuard(g, dt, s.level.walls);
    for (const c of s.cameras) updateCamera(c, dt, s.time);
    for (const sm of s.smokes) sm.left -= dt;
    s.smokes = s.smokes.filter((sm) => sm.left > 0);

    // Detection: guards and cameras raise the alarm; unseen, it decays.
    let seen = null;
    let rise = 0;
    const sneakFactor = s.sneaking ? TUNING.alarmRiseSneakFactor : 1;
    for (const g of s.guards) {
      const sees = guardSeesThief(g, s.thief, s.level.walls, s.smokes,
        TUNING.guardConeRange, TUNING.guardConeHalfAngle);
      g.seeing = sees;
      g.alerted = sees;
      if (sees) { seen = 'guard'; rise = Math.max(rise, TUNING.alarmRiseGuard * sneakFactor); }
    }
    for (const c of s.cameras) {
      const sees = cameraSeesThief(c, s.thief, s.level.walls, s.smokes,
        TUNING.cameraConeRange, TUNING.cameraConeHalfAngle);
      c.seeing = sees;
      if (sees) { seen = 'camera'; rise = Math.max(rise, TUNING.alarmRiseCamera * sneakFactor); }
    }
    s.seenBy = seen;
    if (rise > 0) s.alarm = Math.min(100, s.alarm + rise * dt);
    else s.alarm = Math.max(0, s.alarm - TUNING.alarmDecay * dt);
    s.onEvent('alarm', s.alarm / 100);

    if (s.alarm >= 100) {
      s.state = 'caught';
      s.onEvent('caught');
      return;
    }

    // Small loot.
    for (const c of s.level.smallLoot) {
      if (!c.taken && Math.hypot(s.thief.x - c.x, s.thief.y - c.y) < 26) {
        c.taken = true;
        s.score += TUNING.smallLootPoints;
        s.onEvent('pickup');
      }
    }
    // The big loot.
    if (!s.lootTaken && Math.hypot(s.thief.x - s.level.loot.x, s.thief.y - s.level.loot.y) < 34) {
      s.lootTaken = true;
      s.score += TUNING.mainLootPoints;
      s.onEvent('bigLoot');
    }
    // Getaway: exit only opens with the loot.
    if (s.lootTaken) {
      const e = s.level.exit;
      if (s.thief.x > e.x - 10 && s.thief.x < e.x + e.w + 10 &&
          s.thief.y > e.y - 10 && s.thief.y < e.y + e.h + 10) {
        s.score += TUNING.getawayBonus;
        s.state = 'levelclear';
        s.onEvent('getaway');
      }
    }
  }

  loadLevel(0);
  return { state: s, start, restartRoom, nextLevel, update, throwSmoke, fireEmp, confirm, applyShot };
}
