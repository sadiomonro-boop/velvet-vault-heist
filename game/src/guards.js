// Guards: patrol waypoints, vision cones, and line-of-sight detection.
// A guard sees the thief only when the thief is inside the cone AND no
// solid cover blocks the sight line. Smoke clouds block sight too.
// Cover kinds that block sight: case, pillar, desk, plant, wall, rope.

export const SIGHT_BLOCKERS = new Set(['wall', 'case', 'pillar', 'desk', 'plant', 'rope']);

export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does segment (x1,y1)-(x2,y2) cross rect r?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
      else { if (t < tmin) return false; if (t < tmax) tmax = t; }
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (!SIGHT_BLOCKERS.has(w.kind)) continue;
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

export function pointInCone(px, py, ox, oy, angle, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 12) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= halfAngle;
}

export function createGuard(def, speed) {
  const wps = def.waypoints;
  return {
    x: wps[0].x,
    y: wps[0].y,
    angle: 0,
    wpIndex: 1,
    pauseLeft: 0,
    pause: def.pause || 1,
    waypoints: wps,
    speed,
    alerted: false,
    // True while this guard currently has eyes on the thief.
    seeing: false,
  };
}

export function updateGuard(g, dt, walls) {
  g.seeing = false;
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    return;
  }
  const target = g.waypoints[g.wpIndex];
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    g.pauseLeft = g.pause;
    return;
  }
  const step = Math.min(dist, g.speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  g.angle = Math.atan2(dy, dx);
}

// Returns true when the guard can see the thief right now.
export function guardSeesThief(g, thief, walls, smokes, coneRange, coneHalf) {
  if (!pointInCone(thief.x, thief.y, g.x, g.y, g.angle, coneRange, coneHalf)) return false;
  if (!hasLineOfSight(g.x, g.y, thief.x, thief.y, walls)) return false;
  for (const s of smokes) {
    if (segmentHitsRect(g.x, g.y, thief.x, thief.y, { x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 })) return false;
    if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.r) return false;
  }
  return true;
}
