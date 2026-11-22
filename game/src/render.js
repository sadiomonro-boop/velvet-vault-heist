// All drawing for Velvet Vault Heist — one canvas, flat vector art.
// Colour language, readable at a glance:
//   gold = loot, amber cone = guard danger, red cone = camera danger,
//   teal floor + deep blue shadow = safe cover, green = the getaway door.

import { VIEW_W, VIEW_H, TUNING } from './config.js';

const FLOOR_A = '#1b2340';
const FLOOR_B = '#161d35';
const GOLD = '#f5c542';
const RED = '#e5484d';
const AMBER = '#ffb224';

function drawCone(ctx, x, y, angle, range, half, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawWall(ctx, w) {
  if (w.kind === 'wall') {
    ctx.fillStyle = '#3a2f5b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#d4a94e';
    if (w.h <= 30) ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
    if (w.w <= 30) ctx.fillRect(w.x + w.w - 4, w.y, 4, w.h);
    return;
  }
  if (w.kind === 'case') {
    ctx.fillStyle = '#232c4d';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(140, 200, 255, 0.28)';
    ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, w.h - 12);
    ctx.strokeStyle = '#d4a94e';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (w.kind === 'pillar') {
    ctx.fillStyle = '#4a3f6e';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#6b5a99';
    ctx.fillRect(w.x + 8, w.y + 8, w.w - 16, w.h - 16);
    ctx.strokeStyle = '#d4a94e';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
    return;
  }
  if (w.kind === 'rope') {
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w.x, w.y + 9);
    ctx.quadraticCurveTo(w.x + w.w / 2, w.y + 26, w.x + w.w, w.y + 9);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(w.x, w.y + 9, 5, 0, Math.PI * 2);
    ctx.arc(w.x + w.w, w.y + 9, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (w.kind === 'desk') {
    ctx.fillStyle = '#5b3a2e';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#7a4f3d';
    ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, w.h - 12);
    return;
  }
  if (w.kind === 'plant') {
    ctx.fillStyle = '#2e5d3a';
    ctx.beginPath();
    ctx.arc(w.x + 30, w.y + 28, 26, 0, Math.PI * 2);
    ctx.arc(w.x + 14, w.y + 40, 18, 0, Math.PI * 2);
    ctx.arc(w.x + 46, w.y + 42, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(w.x + 22, w.y + 44, 16, 14);
    return;
  }
}

function drawGuard(ctx, g, time) {
  const bob = Math.sin(time * 6 + g.x) * 1.5;
  ctx.fillStyle = '#20264a';
  ctx.beginPath();
  ctx.arc(g.x, g.y + 4, 17, 0, Math.PI * 2);
  ctx.fill();
  // Body: navy uniform with a gold badge.
  ctx.fillStyle = '#2c3e6e';
  ctx.beginPath();
  ctx.arc(g.x, g.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 7, g.y + bob + Math.sin(g.angle) * 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Face direction tick.
  ctx.strokeStyle = '#e8ecff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y + bob);
  ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + bob + Math.sin(g.angle) * 15);
  ctx.stroke();
  if (g.alerted) {
    ctx.fillStyle = RED;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24 + bob);
  }
}

function drawCamera(ctx, c) {
  ctx.fillStyle = '#39415f';
  ctx.fillRect(c.x - 11, c.y - 8, 22, 16);
  ctx.fillStyle = c.disabledLeft > 0 ? '#5a6278' : RED;
  ctx.beginPath();
  ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a8fa8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - 8);
  ctx.lineTo(c.x, c.y - 16);
  ctx.stroke();
  if (c.disabledLeft > 0) {
    ctx.fillStyle = '#9aa3b8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP ' + Math.ceil(c.disabledLeft) + 's', c.x, c.y + 30);
  }
}

function drawThief(ctx, t, time, sneaking) {
  const bob = sneaking ? 0 : Math.sin(time * 10) * 1.5;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak: charcoal with a purple lining, gold clasp.
  ctx.fillStyle = '#17131f';
  ctx.beginPath();
  ctx.arc(t.x, t.y + bob, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6d28d9';
  ctx.beginPath();
  ctx.arc(t.x, t.y + bob, 14, 0.3, Math.PI - 0.3);
  ctx.fill();
  // Mask + eyes.
  ctx.fillStyle = '#f2e6c9';
  ctx.beginPath();
  ctx.arc(t.x, t.y - 2 + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#17131f';
  ctx.fillRect(t.x - 7, t.y - 5 + bob, 14, 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(t.x - 4, t.y - 4 + bob, 2.5, 2.5);
  ctx.fillRect(t.x + 2, t.y - 4 + bob, 2.5, 2.5);
  if (sneaking) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y + bob, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLoot(ctx, loot, taken, time) {
  if (taken) return;
  const pulse = 1 + Math.sin(time * 3) * 0.12;
  // Pedestal.
  ctx.fillStyle = '#3a2f5b';
  ctx.fillRect(loot.x - 26, loot.y - 18, 52, 36);
  ctx.fillStyle = '#d4a94e';
  ctx.fillRect(loot.x - 26, loot.y - 22, 52, 6);
  // Glow.
  const glow = ctx.createRadialGradient(loot.x, loot.y - 26, 4, loot.x, loot.y - 26, 52 * pulse);
  glow.addColorStop(0, 'rgba(245, 197, 66, 0.55)');
  glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y - 26, 52 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // The gem itself.
  ctx.save();
  ctx.translate(loot.x, loot.y - 26);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(-11, -11, 22, 22);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(-11, -11, 22, 8);
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.label.toUpperCase(), loot.x, loot.y + 42);
}

function drawAlarmMeter(ctx, alarm, time) {
  const x = 440;
  const y = 18;
  const w = 400;
  const h = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 8, y - 8, w + 16 + 150, h + 16);
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', x, y + 16);
  const bx = x + 64;
  const bw = w - 64;
  ctx.fillStyle = '#2a2f45';
  ctx.fillRect(bx, y, bw, h);
  const frac = alarm / 100;
  const col = frac < 0.5 ? '#f5c542' : frac < 0.8 ? '#ff8c42' : RED;
  ctx.fillStyle = col;
  ctx.fillRect(bx, y, bw * frac, h);
  if (frac >= 0.8) {
    ctx.strokeStyle = (Math.sin(time * 12) > 0) ? RED : '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 2, y - 2, bw + 4, h + 4);
  }
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(Math.round(alarm) + '%', bx + bw + 10, y + 16);
}

export function render(ctx, s) {
  const time = s.time;
  // Floor: deep teal checker with a gold-trimmed art-deco border.
  for (let gy = 0; gy < 9; gy++) {
    for (let gx = 0; gx < 16; gx++) {
      ctx.fillStyle = (gx + gy) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(gx * 80, gy * 80, 80, 80);
    }
  }
  ctx.strokeStyle = 'rgba(212, 169, 78, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, VIEW_W - 68, VIEW_H - 68);
  // Paintings on the top wall.
  for (let i = 0; i < 5; i++) {
    const px = 120 + i * 220;
    ctx.fillStyle = ['#7a2e2e', '#2e5d3a', '#2e4a7a', '#6b4a8a', '#8a6d2f'][i];
    ctx.fillRect(px, 30, 90, 26);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, 30, 90, 26);
  }

  // Exit door — the getaway, always visible.
  const e = s.level.exit;
  const exitOpen = s.lootTaken;
  ctx.fillStyle = exitOpen ? '#22c55e' : '#14532d';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = exitOpen ? '#bbf7d0' : '#4ade80';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exitOpen ? 'GO!' : 'EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  ctx.textAlign = 'center';

  // Vision cones UNDER the actors, over the floor.
  for (const c of s.cameras) {
    if (c.disabledLeft <= 0) {
      drawCone(ctx, c.x, c.y, c.angle, TUNING.cameraConeRange, TUNING.cameraConeHalfAngle,
        'rgba(229, 72, 77, 0.20)', 'rgba(229, 72, 77, 0.45)');
    }
  }
  for (const g of s.guards) {
    drawCone(ctx, g.x, g.y, g.angle, TUNING.guardConeRange, TUNING.guardConeHalfAngle,
      g.seeing ? 'rgba(255, 178, 36, 0.42)' : 'rgba(255, 178, 36, 0.20)',
      'rgba(255, 178, 36, 0.5)');
  }

  for (const w of s.level.walls) drawWall(ctx, w);

  // Exit label AFTER the walls: the bottom outer wall used to paint over
  // it (level 2's label sat inside the wall band and was illegible).
  ctx.fillStyle = '#bbf7d0';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(exitOpen ? 'getaway van waits' : 'locked until loot', VIEW_W - 30, e.y + e.h + 16);
  ctx.textAlign = 'center';

  // Small loot: gold coins.
  for (const c of s.level.smallLoot) {
    if (c.taken) continue;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6d2f';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 4);
  }
  drawLoot(ctx, s.level.loot, s.lootTaken, time);

  // Smoke clouds.
  for (const sm of s.smokes) {
    ctx.fillStyle = 'rgba(200, 200, 210, 0.35)';
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 220, 230, 0.25)';
    ctx.beginPath();
    ctx.arc(sm.x - 18, sm.y + 8, sm.r * 0.6, 0, Math.PI * 2);
    ctx.arc(sm.x + 20, sm.y - 10, sm.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const c of s.cameras) drawCamera(ctx, c);
  for (const g of s.guards) drawGuard(ctx, g, time);
  drawThief(ctx, s.thief, time, s.sneaking);

  // HUD bar.
  ctx.fillStyle = 'rgba(5, 6, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET VAULT HEIST', 36, 32);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#b9bed4';
  ctx.fillText('Room ' + (s.levelIndex + 1) + ' of 3 — ' + s.level.name, 36, 48);
  drawAlarmMeter(ctx, s.alarm, time);

  // Score + tools, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('LOOT  $' + s.score, VIEW_W - 36, 30);
  ctx.fillStyle = '#b9bed4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Click: smoke bomb ($' + TUNING.smokeCost + ')   •   2: EMP ($' + TUNING.empCost + ')   •   Shift: sneak', VIEW_W - 36, 48);

  // Objective line under the HUD.
  ctx.textAlign = 'center';
  ctx.fillStyle = s.lootTaken ? '#4ade80' : GOLD;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(s.lootTaken ? 'Loot secured — reach the green EXIT door!' : 'Objective: steal the ' + s.level.loot.label + ' — stay out of the cones!', VIEW_W / 2, 76);

  // Spotted warning.
  if (s.seenBy) {
    ctx.fillStyle = RED;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!  Break line of sight!', VIEW_W / 2, 112);
  }

  if (s.state === 'title') {
    ctx.fillStyle = 'rgba(5, 6, 14, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VELVET VAULT', VIEW_W / 2, 250);
    ctx.fillText('HEIST', VIEW_W / 2, 320);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '20px Georgia, serif';
    ctx.fillText('Three rooms. Three treasures. One clean getaway.', VIEW_W / 2, 380);
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillStyle = '#b9bed4';
    ctx.fillText('WASD / arrows to move  •  Shift to sneak  •  Click: smoke bomb ($15)  •  2: EMP ($25)', VIEW_W / 2, 430);
    ctx.fillText('Guards see you in their amber cones. Cameras watch in red. Fill the alarm and you are caught.', VIEW_W / 2, 460);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Press ENTER or click to start the heist', VIEW_W / 2, 520);
  }

  if (s.state === 'caught') {
    ctx.fillStyle = 'rgba(60, 5, 8, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 320);
    ctx.font = '20px Georgia, serif';
    ctx.fillText('The alarm hit 100% — the guards closed in. The crew slips away to try again.', VIEW_W / 2, 365);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('Press R to retry this room  •  loot kept so far: $' + s.score, VIEW_W / 2, 410);
  }

  if (s.state === 'levelclear') {
    ctx.fillStyle = 'rgba(5, 20, 10, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 300);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '20px Georgia, serif';
    ctx.fillText(s.level.name + ' cleared — getaway bonus +$' + TUNING.getawayBonus, VIEW_W / 2, 350);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('Press ENTER for the next room', VIEW_W / 2, 400);
  }

  if (s.state === 'won') {
    ctx.fillStyle = 'rgba(5, 6, 14, 0.85)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 56px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE PERFECT HEIST', VIEW_W / 2, 290);
    ctx.fillStyle = '#e8ecff';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('All three treasures lifted. The crew vanishes into the night.', VIEW_W / 2, 345);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('Final loot: $' + s.score, VIEW_W / 2, 400);
    ctx.fillStyle = '#b9bed4';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Press R to replay this room', VIEW_W / 2, 445);
  }
}
