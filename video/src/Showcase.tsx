import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Trailer cinématique 10 s : les patterns du jeu recalculés en motion design.
// Zéro asset, 100 % déterministe (position = f(frame)).
const W = 1280;
const H = 720;
const CX = W / 2;
const CY = H / 2 + 30;

type Bullet = {x: number; y: number; color: string; r: number};

// Spirale du jeu : 2 branches, angle +0.35 par émission, 150 px/s ≈ 5 px/frame
function spiralBullets(frame: number): Bullet[] {
  const out: Bullet[] = [];
  for (let e = 0; e * 3 <= frame; e++) {
    const age = frame - e * 3;
    if (age > 100) continue;
    const base = e * 0.35;
    for (let arm = 0; arm < 2; arm++) {
      const a = base + arm * Math.PI;
      const d = age * 5;
      out.push({
        x: CX + Math.cos(a) * d,
        y: CY + Math.sin(a) * d,
        color: arm ? '#33ff99' : '#99ff33',
        r: 9,
      });
    }
  }
  return out;
}

// Anneaux façon fireRing : 20 balles, rotation lente
function ringBullets(frame: number, at: number): Bullet[] {
  const age = frame - at;
  if (age < 0 || age > 110) return [];
  const out: Bullet[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + age * 0.008;
    const d = age * 4.2;
    out.push({
      x: CX + Math.cos(a) * d,
      y: CY + Math.sin(a) * d,
      color: i % 2 ? '#66ff66' : '#ff33cc',
      r: 10,
    });
  }
  return out;
}

// Le joueur : point lumineux qui slalome (courbe de Lissajous)
function playerPos(frame: number): {x: number; y: number} {
  return {
    x: CX + 360 * Math.sin(frame * 0.045),
    y: CY + 200 * Math.cos(frame * 0.061),
  };
}

// Salves visées sur la position FUTURE du joueur (il esquive de justesse)
function aimedBullets(frame: number, at: number): Bullet[] {
  const out: Bullet[] = [];
  for (let k = 0; k < 5; k++) {
    const fireFrame = at + k * 7;
    const age = frame - fireFrame;
    if (age < 0 || age > 110) continue;
    const t = playerPos(fireFrame + 6);
    const a = Math.atan2(t.y - CY, t.x - CX);
    const d = age * 6.5;
    out.push({x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, color: '#00eeff', r: 8});
  }
  return out;
}

const PHASES = [
  {at: 0, label: 'PHASE 1 — SPIRALE'},
  {at: 100, label: 'PHASE 2 — ANNEAUX'},
  {at: 200, label: 'PHASE 3 — DÉLUGE'},
];

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const bullets = [
    ...spiralBullets(frame),
    ...ringBullets(frame, 100),
    ...ringBullets(frame, 200),
    ...aimedBullets(frame, 40),
    ...aimedBullets(frame, 150),
    ...aimedBullets(frame, 230),
  ].filter((b) => b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40);

  const p = playerPos(frame);

  // Shake après chaque anneau
  const sinceRing = Math.min(frame - 100 < 0 ? 999 : frame - 100, frame - 200 < 0 ? 999 : frame - 200);
  const shake = sinceRing < 12 ? Math.sin(frame * 2.7) * 5 : 0;

  const intro = spring({frame, fps, config: {damping: 80, stiffness: 110}});
  const introY = interpolate(intro, [0, 1], [70, 0]);
  const introO = interpolate(intro, [0, 1], [0, 1]);

  const phase = PHASES.reduce((acc, ph) => (frame >= ph.at ? ph : acc), PHASES[0]);
  const phaseAge = frame - phase.at;
  const phaseO = interpolate(phaseAge, [0, 12, 70, 85], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endO = interpolate(frame, [265, 285], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const hue = (frame * 0.5) % 360;

  return (
    <div
      style={{
        flex: 1,
        background: `radial-gradient(circle at 50% 55%, hsl(${hue}, 50%, 14%), hsl(${(hue + 80) % 360}, 55%, 6%) 75%)`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${-shake}px)`}}>
        {bullets.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x - b.r,
              top: b.y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: '50%',
              background: b.color,
              boxShadow: `0 0 22px 7px ${b.color}`,
            }}
          />
        ))}
        {/* Le mage */}
        <div
          style={{
            position: 'absolute',
            left: CX - 34,
            top: CY - 34,
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: '#4c1d95',
            border: '5px solid #fbbf24',
            boxShadow: '0 0 45px 14px #8b5cf6',
          }}
        />
        {/* Le joueur qui danse entre les balles */}
        <div
          style={{
            position: 'absolute',
            left: p.x - 11,
            top: p.y - 11,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 26px 10px #4ade80',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 70,
          width: '100%',
          textAlign: 'center',
          transform: `translateY(${introY}px)`,
          opacity: introO,
        }}
      >
        <div style={{fontSize: 76, fontWeight: 800, color: 'white', letterSpacing: 4}}>GRAND MAGE</div>
        <div style={{fontSize: 30, color: '#c084fc', letterSpacing: 10, marginTop: 8}}>3 SALLES · 1 RUN · 0 PITIÉ</div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 64,
          width: '100%',
          textAlign: 'center',
          fontSize: 40,
          fontWeight: 700,
          color: '#f87171',
          letterSpacing: 6,
          opacity: phaseO,
        }}
      >
        {phase.label}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: endO,
          background: 'rgba(0,0,0,0.45)',
        }}
      >
        <div style={{fontSize: 64, fontWeight: 800, color: 'white', letterSpacing: 6}}>
          ROULE. TIRE. SURVIS.
        </div>
      </div>
    </div>
  );
};
