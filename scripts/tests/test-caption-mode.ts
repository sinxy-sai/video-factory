import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  episodeManifestSchema,
  resolveCaptionMode,
  sceneSchema,
  type CaptionMode,
  type EpisodeManifest,
  type SceneManifest,
} from '../../content/schema';
import {validateSceneCaptions, validateWorkflow} from '../lib/episode-workflow-validation';

const scene = (overrides: Record<string, unknown> = {}) => sceneSchema.parse({
  id: 'intro',
  title: '缓存命中',
  claim: '命中缓存可以少跑一趟。',
  visual: 'intro',
  durationInFrames: 150,
  beats: [{id: 'enter', purpose: 'enter', startFrame: 0, durationInFrames: 30}],
  captions: [],
  ...overrides,
});

assert.equal(scene().captionMode, undefined, 'captionMode stays optional for existing manifests');
assert.equal(resolveCaptionMode(scene()), 'required', 'missing captionMode defaults to required');
assert.equal(resolveCaptionMode(scene({captionMode: 'optional'})), 'optional');
assert.equal(resolveCaptionMode(scene({captionMode: 'none'})), 'none');

assert.throws(() => scene({captionMode: 'none', captions: [{id: 'line-1', text: '无字幕镜头', startFrame: 0, durationInFrames: 30}]}), /captionMode none/);

const shortCaptionScene = (mode: CaptionMode) => scene({
  captionMode: mode,
  captions: [{id: 'line-1', text: '只覆盖一部分', startFrame: 0, durationInFrames: 40}],
});
assert.throws(() => validateSceneCaptions({episodeId: 'demo', shotId: 'shot-001', scene: shortCaptionScene('required')}), /less than 80%/);
assert.doesNotThrow(() => validateSceneCaptions({episodeId: 'demo', shotId: 'shot-001', scene: shortCaptionScene('optional')}));
assert.doesNotThrow(() => validateSceneCaptions({episodeId: 'demo', shotId: 'shot-001', scene: scene({captionMode: 'none'})}));
assert.throws(
  () => validateSceneCaptions({episodeId: 'demo', shotId: 'shot-001', scene: {...scene({captionMode: 'none'}), captions: shortCaptionScene('optional').captions} as SceneManifest}),
  /captionMode none/,
);

const manifestFor = (captionMode?: CaptionMode): EpisodeManifest => episodeManifestSchema.parse({
  id: 'caption-demo',
  title: '字幕模式示例',
  language: 'zh-CN',
  format: 'landscape',
  width: 1920,
  height: 1080,
  fps: 30,
  theme: 'clear-science',
  scenes: [{
    id: 'intro',
    title: '缓存命中',
    claim: '命中缓存可以少跑一趟。',
    visual: 'intro',
    durationInFrames: 150,
    ...(captionMode ? {captionMode} : {}),
    beats: [{id: 'enter', purpose: 'enter', startFrame: 0, durationInFrames: 30}],
    captions: [],
  }],
});

const root = mkdtempSync(join(tmpdir(), 'science-video-caption-mode-'));
const previousCwd = process.cwd();
try {
  const episodeRoot = join(root, 'content', 'episodes', 'caption-demo');
  const write = (relativePath: string, content: string) => {
    const path = join(episodeRoot, relativePath);
    mkdirSync(join(path, '..'), {recursive: true});
    writeFileSync(path, content, 'utf8');
  };
  const approvedFrontMatter = '---\nstate: shot-design-approved\napprovals:\n  content: true\n  storyboard: true\n  shot-design: true\n---\n\n';
  write('content-plan.md', `${approvedFrontMatter}# 内容计划\n\n受众是初学者，目标是解释缓存命中，事实边界来自公开资料。`);
  write('shot-design.md', `${approvedFrontMatter}# 分镜设计\n\n第一镜展示缓存命中，第二段说明连续性和字幕取舍。`);
  write('script.md', '# 示例\n\n命中缓存时，数据不需要再去远处取。');
  write('storyboard.md', '# 分镜表\n\n| 镜头 | 时间 | 画面 |\n|---|---|---|\n| shot-001 | 00:00–00:05 | 缓存命中 |\n');
  write('visual-style.md', '# 风格\n\n深色背景，青色高亮，关系标签保持简短。');
  write('shot-briefs/shot-001.json', JSON.stringify({
    id: 'shot-001',
    sceneId: 'intro',
    title: '缓存命中',
    narration: '命中缓存时，数据不需要再去远处取。',
    visual: 'intro',
    renderer: 'browser',
    visualStyle: 'episode-defined',
    visualDirection: {composition: '左侧来源指向右侧结果', focalPoint: '缓存节点', hierarchy: ['缓存节点'], palette: '深色青色', typography: '无衬线'},
    motion: {entrance: '节点浮现', transformation: '连线生长', exit: 'transition-owned', transition: '硬切', pacing: 'measured'},
    durationInFrames: 150,
    continuity: {leaves: ['cache-node'], inherits: []},
    implementation: {sourceRoot: 'html/shot-001', output: {kind: 'mp4', path: 'renders/caption-demo/shots/shot-001.mp4', width: 1920, height: 1080, fps: 30}, composition: 'asset', visualMode: 'html', files: ['html/shot-001/index.html']},
    qualityChecks: {lint: true, validate: true, inspect: true, animationMap: true, strict: true},
    assets: [],
  }, null, 2));
  write('html/shot-001/index.html', '<!doctype html><html><head><title>shot</title></head><body><div data-composition-id="shot-001" data-width="1920" data-height="1080" data-duration="5"><main><div class="cluster">缓存</div></main></div></body></html>');
  mkdirSync(join(episodeRoot, 'manim'), {recursive: true});
  mkdirSync(join(episodeRoot, 'assets', 'generated'), {recursive: true});

  process.chdir(root);
  assert.doesNotThrow(() => validateWorkflow({manifest: manifestFor('none')}), 'captionMode none must pass without captions');
  assert.doesNotThrow(() => validateWorkflow({manifest: manifestFor('optional')}), 'captionMode optional must pass without captions');
  assert.throws(() => validateWorkflow({manifest: manifestFor()}), /less than 80%/, 'default mode must keep the required coverage contract');
  assert.throws(() => validateWorkflow({manifest: manifestFor('required')}), /less than 80%/);
  console.log('captionMode required/optional/none changes workflow caption coverage as expected');
} finally {
  process.chdir(previousCwd);
  rmSync(root, {recursive: true, force: true});
}