import React from 'react';
import {Audio, Video, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chapter, FPS} from './chapters';

const KEYWORDS = new Set([
  'const', 'let', 'for', 'if', 'else', 'return', 'new', 'this',
  'true', 'false', 'null', 'undefined',
]);

function renderLine(line: string, key: number): React.ReactNode {
  const parts = line.split(/('[^']*'|"[^"]*"|\b\d[\d.]*\b|\b[A-Za-z_$][\w$]*\b)/g);
  return (
    <div key={key} style={{whiteSpace: 'pre'}}>
      {parts.map((p, i) => {
        let color = '#e2e8f0';
        if (/^'.*'$|^".*"$/.test(p)) color = '#86efac';
        else if (/^\d[\d.]*$/.test(p)) color = '#fdba74';
        else if (KEYWORDS.has(p)) color = '#c084fc';
        else if (/^[A-Za-z_$][\w$]*$/.test(p)) color = '#7dd3fc';
        return (
          <span key={i} style={{color}}>
            {p}
          </span>
        );
      })}
    </div>
  );
}

const CodeBlock: React.FC<{file: string; lines: string[]}> = ({file, lines}) => {
  return (
    <div
      style={{
        background: 'rgba(10, 10, 25, 0.85)',
        border: '1px solid #4c1d95',
        borderRadius: 16,
        padding: '28px 36px',
        fontFamily: 'Consolas, Menlo, monospace',
        fontSize: 30,
        lineHeight: 1.6,
        minWidth: 640,
      }}
    >
      <div style={{color: '#f0abfc', fontSize: 24, marginBottom: 16}}>{file}</div>
      {lines.map((l, i) => renderLine(l, i))}
    </div>
  );
};

const CaptureSlot: React.FC<{label: string}> = ({label}) => {
  return (
    <div
      style={{
        width: 640,
        height: 360,
        border: '2px dashed #4c1d95',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        background: 'rgba(10, 10, 25, 0.6)',
      }}
    >
      <div style={{fontSize: 44}}>🎮</div>
      <div style={{color: '#a78bfa', fontSize: 26, fontFamily: 'sans-serif'}}>capture : {label}</div>
      <div style={{color: '#64748b', fontSize: 20, fontFamily: 'sans-serif'}}>voir GUIDE_CAPTURE.md</div>
    </div>
  );
};

export const ChapterScene: React.FC<{chapter: Chapter; index: number}> = ({chapter, index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const titleProgress = spring({frame, fps, config: {damping: 100, stiffness: 120}});
  const titleY = interpolate(titleProgress, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  const captionOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Fond psychédélique animé (clin d'œil au jeu)
  const hue = (frame * 0.4 + index * 47) % 360;
  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(135deg, hsl(${hue}, 45%, 8%) 0%, hsl(${(hue + 60) % 360}, 50%, 12%) 100%)`,
        color: 'white',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 120px',
        position: 'relative',
      }}
    >
      <div style={{color: '#f0abfc', fontSize: 34, letterSpacing: 6, marginBottom: 20}}>
        {chapter.kicker}
      </div>
      <div
        style={{
          fontSize: 88,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          maxWidth: 1500,
        }}
      >
        {chapter.title}
      </div>
      <div style={{fontSize: 36, color: '#cbd5e1', marginBottom: 60, opacity: titleOpacity}}>
        {chapter.subtitle}
      </div>

      <div style={{display: 'flex', gap: 60, alignItems: 'center', minHeight: 380}}>
        {chapter.code ? (
          <CodeBlock file={chapter.code.file} lines={chapter.code.lines} />
        ) : chapter.capture ? (
          <Video
            src={staticFile(`captures/${chapter.capture}`)}
            style={{width: 640, height: 360, borderRadius: 16}}
          />
        ) : (
          <CaptureSlot label={chapter.id + '.mp4'} />
        )}
        <div style={{fontSize: 120, opacity: 0.9}}>0{index + 1}</div>
      </div>

      {/* Sous-titre = narration (sert aussi de preview sans voix) */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: 120,
          right: 120,
          textAlign: 'center',
          fontSize: 30,
          lineHeight: 1.5,
          background: 'rgba(0, 0, 0, 0.55)',
          borderRadius: 12,
          padding: '16px 32px',
          opacity: captionOpacity,
        }}
      >
        {chapter.narration}
      </div>

      {/* Barre de progression du chapitre */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 8,
          width: `${progress * 100}%`,
          background: '#c084fc',
        }}
      />
      {chapter.voice ? <Audio src={staticFile(`voice/${chapter.voice}`)} /> : null}
    </div>
  );
};

export const Void: React.FC = () => null;
export {FPS};
