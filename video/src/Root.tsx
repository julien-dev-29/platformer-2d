import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {TestDrive} from './Test';
import {Showcase} from './Showcase';
import {FPS, TOTAL_FRAMES} from './chapters';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TestDrive"
        component={TestDrive}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Showcase"
        component={Showcase}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
