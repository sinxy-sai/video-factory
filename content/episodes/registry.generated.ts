// GENERATED FILE. Run npm run generate-episode-registry to update.
import type {EpisodeModule} from '../episode-module';
import {episode as episode_kid_phantom_pv} from './kid-phantom-pv/episode';
import {episode as episode_smoke_test} from './smoke-test/episode';

export const episodeRegistry: Record<string, EpisodeModule> = {
  [episode_kid_phantom_pv.manifest.id]: episode_kid_phantom_pv,
  [episode_smoke_test.manifest.id]: episode_smoke_test,
};

export function getEpisodeModule(id: string): EpisodeModule {
  const episode = episodeRegistry[id];
  if (!episode) {
    throw new Error(`Unknown episode "${id}". Available episodes: ${Object.keys(episodeRegistry).join(', ')}`);
  }
  return episode;
}
