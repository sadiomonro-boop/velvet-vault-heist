// Original sound effects, synthesised live with WebAudio — no audio files.
// A soft pluck for loot, a rising alarm drone while spotted, a sting when
// caught, and a short jingle for a clean getaway.

export function createSound() {
  let ctx = null;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (err) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, seconds, type, volume, when = 0) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    unlock() { ensure(); },
    pickup() { tone(880, 0.16, 'sine', 0.16); tone(1318, 0.2, 'sine', 0.12, 0.07); },
    bigLoot() { tone(523, 0.2, 'triangle', 0.18); tone(659, 0.2, 'triangle', 0.18, 0.1); tone(784, 0.34, 'triangle', 0.2, 0.2); },
    smoke() { tone(220, 0.3, 'sawtooth', 0.05); tone(160, 0.35, 'sawtooth', 0.05, 0.05); },
    emp() { tone(1200, 0.12, 'square', 0.06); tone(500, 0.25, 'square', 0.06, 0.08); },
    caught() { tone(196, 0.5, 'sawtooth', 0.16); tone(147, 0.7, 'sawtooth', 0.16, 0.18); },
    getaway() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.11));
    },
    setAlarmLevel(level) {
      // level 0..1 — a low pulsing drone that grows as the alarm fills.
      const c = ensure();
      if (!c) return;
      if (level <= 0.02) {
        if (alarmOsc) { try { alarmOsc.stop(); } catch (e) {} alarmOsc = null; }
        return;
      }
      if (!alarmOsc) {
        alarmOsc = c.createOscillator();
        alarmGain = c.createGain();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.value = 110;
        alarmGain.gain.value = 0;
        alarmOsc.connect(alarmGain);
        alarmGain.connect(c.destination);
        alarmOsc.start();
      }
      alarmOsc.frequency.setTargetAtTime(110 + level * 160, c.currentTime, 0.1);
      alarmGain.gain.setTargetAtTime(0.015 + level * 0.05, c.currentTime, 0.1);
    },
  };
}
