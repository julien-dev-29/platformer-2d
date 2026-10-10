// Mini-synthèse WebAudio : zéro asset, que des blips.
let ctx = null;
let noiseBuf = null;
let muted = false;

export function initAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const len = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone({ freq = 440, end = null, type = 'square', dur = 0.1, vol = 0.12, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(freq, 1), t0);
  if (end) o.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.15, vol = 0.12, delay = 0, filterFreq = 1200, type = 'lowpass' }) {
  if (!ctx || muted || !noiseBuf) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export function sfx(name) {
  if (!ctx || muted) return;
  switch (name) {
    case 'shoot':
      tone({ freq: 880, end: 220, dur: 0.08 });
      break;
    case 'shotgun':
      noise({ dur: 0.18, vol: 0.16, filterFreq: 900 });
      tone({ freq: 150, end: 60, type: 'sawtooth', dur: 0.12 });
      break;
    case 'hit':
      tone({ freq: 1200, dur: 0.03, vol: 0.08 });
      break;
    case 'enemyDie':
      tone({ freq: 400, end: 60, type: 'sawtooth', dur: 0.25 });
      break;
    case 'playerHurt':
      tone({ freq: 160, end: 50, type: 'sawtooth', dur: 0.3, vol: 0.16 });
      break;
    case 'blank':
      tone({ freq: 100, end: 1200, type: 'sine', dur: 0.5, vol: 0.14 });
      noise({ dur: 0.4, vol: 0.1, filterFreq: 3000, type: 'highpass' });
      break;
    case 'reload':
      tone({ freq: 500, dur: 0.04, vol: 0.1 });
      tone({ freq: 700, dur: 0.04, vol: 0.1, delay: 0.12 });
      break;
    case 'door':
      tone({ freq: 660, type: 'sine', dur: 0.12, vol: 0.1 });
      tone({ freq: 990, type: 'sine', dur: 0.18, vol: 0.1, delay: 0.1 });
      break;
    case 'phase':
      tone({ freq: 330, dur: 0.15 });
      tone({ freq: 440, dur: 0.2, delay: 0.15 });
      break;
    case 'win':
      [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.14, vol: 0.12, delay: i * 0.1 }));
      break;
    case 'lose':
      tone({ freq: 300, end: 80, type: 'sawtooth', dur: 0.6, vol: 0.14 });
      break;
    case 'chest':
      tone({ freq: 880, type: 'sine', dur: 0.08, vol: 0.1 });
      tone({ freq: 1320, type: 'sine', dur: 0.12, vol: 0.1, delay: 0.08 });
      break;
    case 'dodge':
      noise({ dur: 0.12, vol: 0.07, filterFreq: 2500, type: 'highpass' });
      break;
    default:
      break;
  }
}
