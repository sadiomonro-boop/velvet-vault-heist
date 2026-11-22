// Security cameras: fixed mounts that sweep a red vision cone back and
// forth. An EMP burst freezes them for a few seconds; while frozen their
// cone goes dark and they cannot raise the alarm.

import { pointInCone, hasLineOfSight, segmentHitsRect } from './guards.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    phase: Math.random() * 2 * Math.PI,
    angle: def.baseAngle,
    disabledLeft: 0,
    seeing: false,
  };
}

export function updateCamera(c, dt, time) {
  c.seeing = false;
  if (c.disabledLeft > 0) {
    c.disabledLeft -= dt;
    return;
  }
  c.angle = c.baseAngle + Math.sin(time * c.speed + c.phase) * c.sweep;
}

export function cameraSeesThief(c, thief, walls, smokes, coneRange, coneHalf) {
  if (c.disabledLeft > 0) return false;
  if (!pointInCone(thief.x, thief.y, c.x, c.y, c.angle, coneRange, coneHalf)) return false;
  if (!hasLineOfSight(c.x, c.y, thief.x, thief.y, walls)) return false;
  for (const s of smokes) {
    if (segmentHitsRect(c.x, c.y, thief.x, thief.y, { x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 })) return false;
    if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.r) return false;
  }
  return true;
}
