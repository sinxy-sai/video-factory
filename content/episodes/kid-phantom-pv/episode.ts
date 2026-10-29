import {z} from 'zod';
import type {EpisodeModule} from '../../episode-module';
import {episodeManifestSchema, sceneSchema} from '../../schema';
import {manifest} from './manifest';

const localVisualSchema = z.enum(['moon-arrival', 'card-burst', 'monocle-thread', 'crimson-seal']);
const localManifestSchema = episodeManifestSchema.safeExtend({
  scenes: z.array(sceneSchema.safeExtend({visual: localVisualSchema})),
});
const validatedManifest = localManifestSchema.parse(manifest);

export const episode: EpisodeModule = {
  manifest: validatedManifest,
};