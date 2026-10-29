import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {getEpisodeModule} from '../../content/episodes/registry.generated';
import type {EpisodeManifest} from '../../content/schema';
import {SceneFrame} from '../components/SceneFrame';
import {SceneRenderer} from '../scenes/SceneRenderer';
import {CaptionLayer} from '../components/CaptionLayer';
import {CinematicOverlay} from '../components/CinematicOverlay';
import '../styles.css';

export const ScienceVideo: React.FC<{manifest?: EpisodeManifest | null}> = ({manifest}) => {
  if (!manifest) {
    return <AbsoluteFill style={{backgroundColor: '#000'}} />;
  }
  let offset = 0;
  return (
    <AbsoluteFill className="science-video">
      {manifest.scenes.map((scene) => {
        const from = offset;
        offset += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames}>
            <SceneContent episodeId={manifest.id} scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneContent: React.FC<{
  episodeId: string;
  scene: EpisodeManifest['scenes'][number];
}> = ({episodeId, scene}) => {
  return (
    <SceneFrame>
      <SceneRenderer episodeId={episodeId} scene={scene} />
      <CinematicOverlay />
      <CaptionLayer scene={scene} />
    </SceneFrame>
  );
};
