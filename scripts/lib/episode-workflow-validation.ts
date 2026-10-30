import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {shotBriefSchema, type ShotBrief} from '../../content/shot-brief';
import type {EpisodeModule} from '../../content/episode-module';
import {resolveCaptionMode, type SceneManifest} from '../../content/schema';
import {validatePlanning} from '../../production/planning';
import {implementationFiles, isLayeredImplementation} from '../../production/shot-contract';
import {containsPlaceholder} from './placeholder-terms';

const nonEmpty = (path: string) => existsSync(path) && readFileSync(path, 'utf8').trim().length > 0;

const normalizeText = (value: string) => value.replace(/\s+/g, '').trim();
const visibleText = (source: string) => source
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<head\b[\s\S]*?<\/head>/gi, '')
  .replace(/<script\b[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ');

/**
 * Browser shots own the visual relationship; the episode title, shot number,
 * and narration captions belong to metadata/Remotion layers. Keep this check
 * deliberately small and deterministic so it catches the common PPT-like
 * duplication without banning useful labels such as "缓存" or "远处来源".
 */
export function validateBrowserShotText(input: {
  episodeId: string;
  shotId: string;
  title: string;
  captions: string[];
  source: string;
}): void {
  const source = input.source;
  const normalizedSource = normalizeText(visibleText(source));
  const title = normalizeText(input.title);
  if (title.length >= 4 && normalizedSource.includes(title)) {
    throw new Error(`${input.episodeId}/${input.shotId}: browser shot must not render ShotBrief title text; keep titles in metadata and captions in Remotion`);
  }
  if (/(?:SHOT\s*[/#-]?\s*\d{1,3}|镜头\s*[0-9一二三四五六七八九十]+|分镜\s*[0-9一二三四五六七八九十]+)/i.test(visibleText(source))) {
    throw new Error(`${input.episodeId}/${input.shotId}: browser shot must not render shot sequence labels such as SHOT / 001 or 镜头 01`);
  }
  for (const caption of input.captions) {
    const normalizedCaption = normalizeText(caption);
    if (normalizedCaption.length >= 6 && normalizedSource.includes(normalizedCaption)) {
      throw new Error(`${input.episodeId}/${input.shotId}: browser shot repeats caption text; captions are rendered by Remotion`);
    }
    const duplicatedFragments = duplicatedCaptionFragments(caption, normalizedSource);
    if (duplicatedFragments.length > 0) {
      throw new Error(`${input.episodeId}/${input.shotId}: browser shot repeats caption phrases (${duplicatedFragments.join('、')}); captions are rendered by Remotion`);
    }
  }
}

// Chinese captions and in-shot labels both need short, shared vocabulary
// ("缓存", "远处来源"). A six-character window matched almost any sentence, so
// only a ten-character overlap still counts as duplicated narration. Fragments
// that are mostly common connective phrasing are exempt because they carry no
// explanation of their own.
const CAPTION_DUPLICATION_FRAGMENT_LENGTH = 10;
const MIN_FRAGMENT_CONTENT_CHARACTERS = 3;
const commonCaptionPhrases = [
  '这是一个', '这就是', '我们', '你们', '他们', '这是', '这个', '那个', '可以', '因为',
  '所以', '但是', '如果', '那么', '什么', '怎么', '为什么', '一个', '一种', '不是',
  '没有', '需要', '已经', '还是', '或者', '而且', '然后', '现在', '时候', '地方',
  '知道', '看到', '觉得', '应该', '可能', '其实', '开始', '最后', '有些', '很多',
  '非常', '比较', '通常', '一般', '一起', '这样', '那样', '只是', '就是', '还有',
  '以及', '虽然', '不过', '于是', '因此', '例如', '比如', '每次', '这次', '那次',
];

function isCommonCaptionFragment(fragment: string): boolean {
  let remainder = fragment;
  for (const phrase of commonCaptionPhrases) remainder = remainder.split(phrase).join('');
  return remainder.length < MIN_FRAGMENT_CONTENT_CHARACTERS;
}

function duplicatedCaptionFragments(caption: string, normalizedSource: string): string[] {
  const hanText = caption.replace(/[^\u3400-\u9fff]/g, '');
  const fragments: string[] = [];
  for (let index = 0; index <= hanText.length - CAPTION_DUPLICATION_FRAGMENT_LENGTH; index += 1) {
    const fragment = hanText.slice(index, index + CAPTION_DUPLICATION_FRAGMENT_LENGTH);
    if (!normalizedSource.includes(fragment)) continue;
    if (isCommonCaptionFragment(fragment)) continue;
    fragments.push(fragment);
  }
  return [...new Set(fragments)];
}

/**
 * Caption coverage follows the scene's caption mode:
 * required (default) keeps the 80% contract, optional allows sparse captions,
 * and none rejects captions entirely.
 */
export function validateSceneCaptions(input: {
  episodeId: string;
  shotId: string;
  scene: SceneManifest;
}): void {
  const mode = resolveCaptionMode(input.scene);
  const captionFrames = input.scene.captions.reduce((total, caption) => total + caption.durationInFrames, 0);
  if (mode === 'none') {
    if (input.scene.captions.length > 0) {
      throw new Error(`${input.episodeId}/${input.shotId}: captionMode none requires an empty captions array`);
    }
    return;
  }
  if (mode === 'required' && captionFrames < input.scene.durationInFrames * 0.8) {
    throw new Error(`${input.episodeId}/${input.shotId}: captions cover less than 80% of shot duration`);
  }
}

export function loadShotBriefs(episodeId: string, projectRoot = process.cwd()): ShotBrief[] {
  const directory = resolve(projectRoot, 'content', 'episodes', episodeId, 'shot-briefs');
  if (!existsSync(directory)) throw new Error(`${episodeId}: missing shot-briefs/`);
  const files = readdirSync(directory).filter((file) => /^shot-[0-9]{3}\.json$/.test(file)).sort();
  if (files.length === 0) throw new Error(`${episodeId}: shot-briefs/ must contain shot-001.json or later`);
  return files.map((file) => {
    const path = join(directory, file);
    const result = shotBriefSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    if (!result.success) throw new Error(`${episodeId}/${file}: ${result.error.message}`);
    return result.data;
  });
}

export function validateWorkflow(episode: EpisodeModule): void {
  const id = episode.manifest.id;
  const root = resolve('content', 'episodes', id);
  validatePlanning(id);
  for (const file of ['script.md', 'storyboard.md', 'visual-style.md']) {
    const path = join(root, file);
    if (!nonEmpty(path)) throw new Error(`${id}: missing ${file}`);
    const text = readFileSync(path, 'utf8');
    if (containsPlaceholder(text)) throw new Error(`${id}: ${file} still contains placeholder text`);
  }
  for (const directory of ['html', 'manim', 'assets/generated']) {
    if (!existsSync(join(root, directory))) throw new Error(`${id}: missing ${directory}/`);
  }

  const briefs = loadShotBriefs(id);
  const scenes = episode.manifest.scenes;
  const sceneIds = new Set(scenes.map((scene) => scene.id));
  const briefSceneIds = new Set<string>();
  for (const [index, brief] of briefs.entries()) {
    if ([brief.title, brief.narration, brief.visualStyle, brief.visualDirection.composition, brief.visualDirection.focalPoint, brief.visualDirection.palette, brief.visualDirection.typography, brief.motion.entrance, brief.motion.transformation, brief.motion.transition].some(containsPlaceholder)) {
      throw new Error(`${id}/${brief.id}: ShotBrief still contains placeholder visual or motion direction`);
    }
    if (brief.visualStyle !== 'episode-defined') throw new Error(`${id}/${brief.id}: external style packs are not configured; define the episode visual language in visual-style.md`);
    const implementation = brief.implementation;
    if (!isLayeredImplementation(implementation) && brief.renderer === 'browser' && !implementation.sourceRoot.startsWith('html/')) throw new Error(`${id}/${brief.id}: browser shots must use an html/<shot-id>/ sourceRoot`);
    if (!isLayeredImplementation(implementation) && brief.renderer === 'manim' && !implementation.sourceRoot.startsWith('manim/')) throw new Error(`${id}/${brief.id}: manim shots must use a manim/<shot-id>/ sourceRoot`);
    if (!isLayeredImplementation(implementation) && brief.renderer === 'manim' && !implementation.entryPoint) throw new Error(`${id}/${brief.id}: manim shots must declare implementation.entryPoint`);
    if (!isLayeredImplementation(implementation) && implementation.sourceRoot.startsWith('hyperframes/')) throw new Error(`${id}/${brief.id}: legacy hyperframes source paths are not supported`);
    if (brief.renderer === 'composite' && !isLayeredImplementation(implementation)) throw new Error(`${id}/${brief.id}: composite shots must use layered implementation`);
    if (brief.renderer !== 'composite' && isLayeredImplementation(implementation)) throw new Error(`${id}/${brief.id}: layered implementation must use composite renderer`);
    if (!sceneIds.has(brief.sceneId)) throw new Error(`${id}/${brief.id}: sceneId ${brief.sceneId} is not in manifest`);
    briefSceneIds.add(brief.sceneId);
    const scene = scenes.find((item) => item.id === brief.sceneId)!;
    if (brief.durationInFrames !== scene.durationInFrames) throw new Error(`${id}/${brief.id}: duration does not match manifest scene ${brief.sceneId}`);
    const files = implementationFiles(implementation);
    if (brief.renderer === 'browser' && !files.some((file) => file.startsWith('html/'))) throw new Error(`${id}/${brief.id}: browser shot must declare an html implementation file`);
    if (brief.renderer === 'manim' && !files.some((file) => file.startsWith('manim/') && /\.py$/i.test(file))) throw new Error(`${id}/${brief.id}: manim shot must declare a manim .py implementation file`);
    for (const file of files) if (!existsSync(join(root, file))) throw new Error(`${id}/${brief.id}: implementation file does not exist: ${file}`);
    if (brief.renderer === 'browser') {
      const sourceFiles = files.filter((file) => /\.html?$/i.test(file));
      const source = sourceFiles.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
      validateBrowserShotText({
        episodeId: id,
        shotId: brief.id,
        title: brief.title,
        captions: scene.captions.map((caption) => caption.text),
        source,
      });
    }
    if (brief.renderer === 'composite' && isLayeredImplementation(implementation)) {
      for (const layer of implementation.layers.filter((item) => item.renderer === 'browser')) {
        const source = layer.files.filter((file) => /\.html?$/i.test(file)).map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
        validateBrowserShotText({episodeId: id, shotId: `${brief.id}/${layer.id}`, title: brief.title, captions: scene.captions.map((caption) => caption.text), source});
      }
    }
    if (index > 0) {
      const previous = briefs[index - 1];
      const previousLeaves = new Set(previous.continuity.leaves);
      for (const inherited of brief.continuity.inherits) if (!previousLeaves.has(inherited)) throw new Error(`${id}/${brief.id}: continuity inherits ${inherited}, but previous shot does not leave it`);
    }
    validateSceneCaptions({episodeId: id, shotId: brief.id, scene});
  }
  for (const scene of scenes) if (!briefSceneIds.has(scene.id)) throw new Error(`${id}: manifest scene ${scene.id} has no ShotBrief`);
}
