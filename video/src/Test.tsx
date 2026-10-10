import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Mini-compo de test : motion design sans voix, render rapide.
export const TestDrive: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const titleSpring = spring({frame, fps, config: {damping: 90, stiffness: 140}});
  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const hue = (frame * 1.2) % 360;
  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);

  // Rangée de balles qui traverse l'écran (clin d'œil bullet-hell)
  const bullets = [0, 1, 2, 3, 4, 5, 6, 7];
  const bulletX = (i: number) =>
    interpolate(frame, [0, durationInFrames], [-100, 1400], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) -
    i * 130;
  const bulletColors = ['#00eeff', '#ffee00', '#ff33cc', '#66ff66', '#99ff33', '#33ff99', '#ff9500', '#c084fc'];

  const subOpacity = interpolate(frame, [20, 40, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(135deg, hsl(${hue}, 45%, 8%), hsl(${(hue + 70) % 360}, 55%, 14%))`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {bullets.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 120 + i * 55,
            left: bulletX(i),
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: bulletColors[i],
            boxShadow: `0 0 24px 6px ${bulletColors[i]}`,
          }}
        />
      ))}

      <div style={{color: '#f0abfc', fontSize: 28, letterSpacing: 8, marginBottom: 16}}>
        TEST DE RENDU
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 800,
          color: 'white',
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        Bullet hell en motion
      </div>
      <div style={{fontSize: 30, color: '#cbd5e1', marginTop: 20, opacity: subOpacity}}>
        ressorts, dégradés animés, trajectoires — sans voix
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 10,
          width: `${progress * 100}%`,
          background: '#c084fc',
        }}
      />
    </div>
  );
};
