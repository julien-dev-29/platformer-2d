import React from 'react';
import {Sequence} from 'remotion';
import {CHAPTERS, FPS} from './chapters';
import {ChapterScene} from './Scene';

export const Main: React.FC = () => {
  let cursor = 0;
  return (
    <>
      {CHAPTERS.map((chapter, i) => {
        const from = cursor;
        const duration = chapter.seconds * FPS;
        cursor += duration;
        return (
          <Sequence key={chapter.id} from={from} durationInFrames={duration}>
            <ChapterScene chapter={chapter} index={i} />
          </Sequence>
        );
      })}
    </>
  );
};
