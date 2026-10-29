import {z} from 'zod';

export const formatSchema = z.enum(['landscape', 'portrait']);
export type VideoFormat = z.infer<typeof formatSchema>;

export const visualTypeSchema = z.string().min(1);
export type VisualType = z.infer<typeof visualTypeSchema>;

export const sceneBeatPurposeSchema = z.enum(['enter', 'establish', 'focus', 'process', 'compare', 'resolve', 'transition']);
export type SceneBeatPurpose = z.infer<typeof sceneBeatPurposeSchema>;

export const sceneBeatSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  purpose: sceneBeatPurposeSchema,
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
});
export type SceneBeat = z.infer<typeof sceneBeatSchema>;

export const captionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  text: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
});
export type Caption = z.infer<typeof captionSchema>;

/**
 * How much caption coverage a scene needs.
 *
 * - `required` (default): captions must cover at least 80% of the scene.
 * - `optional`: captions are allowed but no minimum coverage is enforced.
 * - `none`: the scene is caption-free (for example a cinematic PV or title card).
 *
 * The field stays optional so existing manifests keep working; resolve it with
 * `resolveCaptionMode` instead of reading `scene.captionMode` directly.
 */
export const captionModeSchema = z.enum(['required', 'optional', 'none']);
export type CaptionMode = z.infer<typeof captionModeSchema>;
export const DEFAULT_CAPTION_MODE: CaptionMode = 'required';

export function resolveCaptionMode(scene: {captionMode?: CaptionMode}): CaptionMode {
  return scene.captionMode ?? DEFAULT_CAPTION_MODE;
}

export const shotAssetReferenceSchema = z.object({
  path: z.string().min(1),
  kind: z.enum(['mp4', 'webm', 'frame-sequence']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive().max(120),
});
export type ShotAssetReference = z.infer<typeof shotAssetReferenceSchema>;

const audioSchema = z
  .object({
    src: z.string().min(1),
    startFromFrame: z.number().int().nonnegative().default(0),
  })
  .optional();

export const sceneSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    claim: z.string().min(1),
    visual: visualTypeSchema,
    durationInFrames: z.number().int().positive(),
    beats: z.array(sceneBeatSchema).min(1),
    captions: z.array(captionSchema).default([]),
    captionMode: captionModeSchema.optional(),
    supportingText: z.string().min(1).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    shotAsset: shotAssetReferenceSchema.optional(),
    audio: audioSchema,
  })
  .superRefine((scene, ctx) => {
    const ids = new Set<string>();
    let previousEnd = 0;
    for (const [index, beat] of scene.beats.entries()) {
      const beatEnd = beat.startFrame + beat.durationInFrames;
      if (ids.has(beat.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['beats', index, 'id'],
          message: `Duplicate beat id: ${beat.id}`,
        });
      }
      if (beat.startFrame < previousEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['beats', index, 'startFrame'],
          message: 'Beats must be sorted and must not overlap',
        });
      }
      if (beatEnd > scene.durationInFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['beats', index],
          message: 'Beat must fit within scene duration',
        });
      }
      ids.add(beat.id);
      previousEnd = Math.max(previousEnd, beatEnd);
    }

    const captionIds = new Set<string>();
    let previousCaptionEnd = 0;
    for (const [index, caption] of scene.captions.entries()) {
      const captionEnd = caption.startFrame + caption.durationInFrames;
      if (captionIds.has(caption.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['captions', index, 'id'],
          message: `Duplicate caption id: ${caption.id}`,
        });
      }
      if (caption.startFrame < previousCaptionEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['captions', index, 'startFrame'],
          message: 'Captions must be sorted and must not overlap',
        });
      }
      if (captionEnd > scene.durationInFrames) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['captions', index],
          message: 'Caption must fit within scene duration',
        });
      }
      captionIds.add(caption.id);
      previousCaptionEnd = Math.max(previousCaptionEnd, captionEnd);
    }

    if (resolveCaptionMode(scene) === 'none' && scene.captions.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['captions'],
        message: 'captionMode none requires an empty captions array',
      });
    }
  });

export type SceneManifest = z.infer<typeof sceneSchema>;

export const episodeManifestSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    language: z.string().min(2),
    format: formatSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive().max(120),
    theme: z.string().min(1),
    scenes: z.array(sceneSchema).min(1),
    audio: audioSchema,
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();
    for (const [index, scene] of value.scenes.entries()) {
      if (ids.has(scene.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes', index, 'id'],
          message: `Duplicate scene id: ${scene.id}`,
        });
      }
      ids.add(scene.id);
    }

    const expectedPortrait = value.format === 'portrait';
    const isPortrait = value.height > value.width;
    if (expectedPortrait !== isPortrait) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['format'],
        message: 'format must match width and height orientation',
      });
    }
  });

export type EpisodeManifest = z.infer<typeof episodeManifestSchema>;

export function totalDurationInFrames(manifest: EpisodeManifest): number {
  return manifest.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
}
