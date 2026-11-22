// Velvet Vault Heist — level layouts and tuning constants.
// One room per level. Every room is drawn and played in a single 1280x720
// frame: walls and display cases are cover, guards patrol, cameras sweep,
// the loot sits on a pedestal, and the exit door is the getaway.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WALL_T = 26; // outer wall thickness

export const TUNING = {
  thiefSpeed: 205,
  sneakSpeed: 105,
  thiefRadius: 15,
  guardSpeed: 78,
  guardConeRange: 185,
  guardConeHalfAngle: 0.61, // ~35 degrees
  cameraConeRange: 215,
  cameraConeHalfAngle: 0.52,
  alarmRiseGuard: 46, // per second while seen by a guard
  alarmRiseCamera: 34, // per second while seen by a camera
  alarmRiseSneakFactor: 0.45,
  alarmDecay: 11, // per second while unseen
  smokeCost: 15,
  empCost: 25,
  smokeSeconds: 5,
  empSeconds: 6,
  mainLootPoints: 100,
  smallLootPoints: 10,
  getawayBonus: 50,
};

// A wall/cover block: {x, y, w, h, kind}
// kind: 'wall' (outer), 'case' (glass display case), 'pillar',
//       'rope' (velvet rope, low cover — blocks sight, not movement),
//       'desk', 'plant' (tall plant, blocks sight)
function block(x, y, w, h, kind) {
  return { x, y, w, h, kind };
}

export const LEVELS = [
  {
    name: 'Gallery of Echoes',
    briefing: 'Lift the Star Sapphire, then slip out the east door.',
    playerStart: { x: 90, y: 600 },
    exit: { x: 1180, y: 84, w: 62, h: 84 },
    loot: { x: 880, y: 330, label: 'Star Sapphire' },
    smallLoot: [
      { x: 300, y: 180, taken: false },
      { x: 640, y: 560, taken: false },
      { x: 1080, y: 520, taken: false },
    ],
    walls: [
      block(0, 0, VIEW_W, WALL_T, 'wall'),
      block(0, VIEW_H - WALL_T, VIEW_W, WALL_T, 'wall'),
      block(0, 0, WALL_T, VIEW_H, 'wall'),
      block(VIEW_W - WALL_T, 0, WALL_T, VIEW_H, 'wall'),
      // Display cases — three routes around each: left, right, or behind.
      block(300, 220, 180, 64, 'case'),
      block(620, 150, 180, 64, 'case'),
      block(920, 480, 180, 64, 'case'),
      block(180, 430, 64, 150, 'pillar'),
      block(560, 380, 64, 150, 'pillar'),
      block(1020, 180, 64, 150, 'pillar'),
      block(430, 300, 220, 18, 'rope'),
      block(760, 560, 220, 18, 'rope'),
      block(1080, 330, 70, 90, 'desk'),
    ],
    guards: [
      { waypoints: [{ x: 380, y: 420 }, { x: 380, y: 130 }, { x: 760, y: 130 }, { x: 760, y: 420 }], pause: 0.9 },
      { waypoints: [{ x: 1080, y: 620 }, { x: 1080, y: 300 }, { x: 700, y: 620 }], pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 40, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
      { x: 1180, y: 380, baseAngle: Math.PI, sweep: 0.7, speed: 0.7 },
    ],
  },
  {
    name: 'The Vault Hall',
    briefing: 'The Golden Idol waits behind two patrols. Cameras never blink.',
    playerStart: { x: 90, y: 120 },
    exit: { x: 1180, y: 600, w: 62, h: 84 },
    loot: { x: 640, y: 360, label: 'Golden Idol' },
    smallLoot: [
      { x: 220, y: 560, taken: false },
      { x: 1060, y: 160, taken: false },
      { x: 640, y: 120, taken: false },
      { x: 420, y: 600, taken: false },
    ],
    walls: [
      block(0, 0, VIEW_W, WALL_T, 'wall'),
      block(0, VIEW_H - WALL_T, VIEW_W, WALL_T, 'wall'),
      block(0, 0, WALL_T, VIEW_H, 'wall'),
      block(VIEW_W - WALL_T, 0, WALL_T, VIEW_H, 'wall'),
      block(260, 260, 200, 64, 'case'),
      block(820, 260, 200, 64, 'case'),
      block(260, 470, 200, 64, 'case'),
      block(820, 470, 200, 64, 'case'),
      block(600, 300, 80, 120, 'pillar'),
      block(120, 300, 64, 140, 'pillar'),
      block(1090, 300, 64, 140, 'pillar'),
      block(430, 180, 200, 18, 'rope'),
      block(650, 560, 200, 18, 'rope'),
      block(480, 360, 60, 60, 'plant'),
      block(780, 360, 60, 60, 'plant'),
    ],
    guards: [
      { waypoints: [{ x: 300, y: 150 }, { x: 980, y: 150 }, { x: 980, y: 600 }, { x: 300, y: 600 }], pause: 0.7 },
      { waypoints: [{ x: 640, y: 200 }, { x: 640, y: 520 }], pause: 1.0 },
      { waypoints: [{ x: 200, y: 360 }, { x: 1080, y: 360 }], pause: 0.5 },
    ],
    cameras: [
      { x: 80, y: 40, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.6 },
      { x: 1200, y: 40, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.6 },
      { x: 640, y: 680, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.8 },
    ],
  },
  {
    name: 'Rooftop Getaway',
    briefing: 'One last prize — the Crown of Meridia — then the van on the roof.',
    playerStart: { x: 90, y: 600 },
    exit: { x: 1180, y: 84, w: 62, h: 84 },
    loot: { x: 640, y: 300, label: 'Crown of Meridia' },
    smallLoot: [
      { x: 300, y: 150, taken: false },
      { x: 980, y: 560, taken: false },
      { x: 640, y: 600, taken: false },
    ],
    walls: [
      block(0, 0, VIEW_W, WALL_T, 'wall'),
      block(0, VIEW_H - WALL_T, VIEW_W, WALL_T, 'wall'),
      block(0, 0, WALL_T, VIEW_H, 'wall'),
      block(VIEW_W - WALL_T, 0, WALL_T, VIEW_H, 'wall'),
      block(340, 180, 160, 64, 'case'),
      block(780, 180, 160, 64, 'case'),
      block(340, 480, 160, 64, 'case'),
      block(780, 480, 160, 64, 'case'),
      block(600, 260, 80, 90, 'pillar'),
      block(200, 320, 64, 140, 'pillar'),
      block(1010, 320, 64, 140, 'pillar'),
      block(440, 380, 200, 18, 'rope'),
      block(640, 120, 200, 18, 'rope'),
    ],
    guards: [
      { waypoints: [{ x: 250, y: 130 }, { x: 1030, y: 130 }, { x: 1030, y: 610 }, { x: 250, y: 610 }], pause: 0.6 },
      { waypoints: [{ x: 640, y: 140 }, { x: 640, y: 580 }], pause: 0.8 },
      { waypoints: [{ x: 180, y: 500 }, { x: 1100, y: 500 }, { x: 1100, y: 200 }, { x: 180, y: 200 }], pause: 0.6 },
    ],
    cameras: [
      { x: 320, y: 40, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.75 },
      { x: 960, y: 40, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.75 },
      { x: 1180, y: 360, baseAngle: Math.PI, sweep: 0.8, speed: 0.9 },
      { x: 80, y: 360, baseAngle: 0, sweep: 0.8, speed: 0.9 },
    ],
  },
];
