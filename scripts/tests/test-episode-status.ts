import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {approveEpisodePlanning} from '../lib/episode-approval';
import {collectEpisodeStatus, nextEpisodeAction, type EpisodeStatus, type EpisodeStatusGroup} from '../lib/episode-status';

const allCheckIds = [
  'episode-directory', 'planning-docs', 'planning-approved', 'script', 'storyboard-doc', 'visual-style',
  'shot-briefs', 'shot-sources', 'shot-renders', 'prepared-assets', 'final-render', 'final-manifest', 'output-verification',
];

const statusWith = (failed: string[], options: {exists?: boolean} = {}): EpisodeStatus => ({
  episodeId: 'demo-topic',
  exists: options.exists ?? true,
  checks: allCheckIds.map((id) => ({id, group: 'planning' as EpisodeStatusGroup, label: id, ok: !failed.includes(id), detail: ''})),
  nextAction: '',
  notes: [],
});

assert.equal(nextEpisodeAction(statusWith([], {exists: false})), 'npm run create-episode -- demo-topic');
assert.match(nextEpisodeAction(statusWith(['planning-docs'])), /Author content-plan\.md and shot-design\.md, then run: npm run approve-episode -- demo-topic/);
assert.equal(nextEpisodeAction(statusWith(['planning-approved'])), 'npm run approve-episode -- demo-topic');
assert.match(nextEpisodeAction(statusWith(['script'])), /author-episode-shots -- demo-topic/);
assert.match(nextEpisodeAction(statusWith(['shot-briefs'])), /Write shot-briefs\/shot-\*\.json.*validate-episode-shots -- demo-topic/);
assert.match(nextEpisodeAction(statusWith(['shot-sources'])), /Implement the declared shot sources.*validate-episode-shots -- demo-topic/);
assert.equal(nextEpisodeAction(statusWith(['shot-renders'])), 'npm run render-episode-shots -- demo-topic');
assert.equal(nextEpisodeAction(statusWith(['prepared-assets'])), 'npm run prepare-episode-assets -- demo-topic');
assert.equal(nextEpisodeAction(statusWith(['final-render'])), 'npm run render-episode -- demo-topic');
assert.equal(nextEpisodeAction(statusWith(['output-verification'])), 'npm run verify-episode-output -- demo-topic');
assert.match(nextEpisodeAction(statusWith([])), /All pipeline stages complete/);

const root = mkdtempSync(join(tmpdir(), 'science-video-status-'));
try {
  const missing = collectEpisodeStatus('missing-topic', root);
  assert.equal(missing.exists, false);
  assert.equal(missing.checks.length, 1);
  assert.equal(missing.nextAction, 'npm run create-episode -- missing-topic');

  const episodeRoot = join(root, 'content', 'episodes', 'demo-topic');
  mkdirSync(episodeRoot, {recursive: true});
  const empty = collectEpisodeStatus('demo-topic', root);
  assert.equal(empty.exists, true);
  assert.equal(empty.checks.find((check) => check.id === 'planning-docs')?.ok, false);
  assert.match(empty.nextAction, /approve-episode -- demo-topic/);

  const frontMatter = '---\nstate: discussion\napprovals:\n  content: false\n  storyboard: false\n  shot-design: false\n---\n\n';
  const body = (title: string, subject: string) => `# ${title}\n\n${subject}这一段记录受众、学习目标、事实边界、旁白结构和资料来源。`.repeat(10);
  writeFileSync(join(episodeRoot, 'content-plan.md'), `${frontMatter}${body('内容计划', '内容')}`, 'utf8');
  writeFileSync(join(episodeRoot, 'shot-design.md'), `${frontMatter}${body('分镜设计', '镜头')}`, 'utf8');
  approveEpisodePlanning('demo-topic', {projectRoot: root});
  writeFileSync(join(episodeRoot, 'script.md'), '# 示例\n\n命中缓存时，数据不需要再去远处取。', 'utf8');
  writeFileSync(join(episodeRoot, 'storyboard.md'), '# 分镜表\n\n| 镜头 |\n|---|\n| shot-001 |\n', 'utf8');
  writeFileSync(join(episodeRoot, 'visual-style.md'), '# 风格\n\n深色背景，青色高亮。', 'utf8');
  mkdirSync(join(episodeRoot, 'shot-briefs'), {recursive: true});
  mkdirSync(join(episodeRoot, 'html', 'shot-001'), {recursive: true});
  mkdirSync(join(episodeRoot, 'manim'), {recursive: true});
  mkdirSync(join(episodeRoot, 'assets', 'generated'), {recursive: true});
  writeFileSync(join(episodeRoot, 'html', 'shot-001', 'index.html'), '<div data-composition-id="shot-001"></div>', 'utf8');
  writeFileSync(join(episodeRoot, 'shot-briefs', 'shot-001.json'), JSON.stringify({
    id: 'shot-001', sceneId: 'intro', title: '缓存命中', narration: '命中缓存时，数据不需要再去远处取。', visual: 'intro',
    renderer: 'browser', visualStyle: 'episode-defined',
    visualDirection: {composition: '来源指向结果', focalPoint: '缓存节点', hierarchy: ['缓存节点'], palette: '深色青色', typography: '无衬线'},
    motion: {entrance: '浮现', transformation: '连线生长', exit: 'transition-owned', transition: '硬切', pacing: 'measured'},
    durationInFrames: 150, continuity: {leaves: ['cache-node'], inherits: []},
    implementation: {sourceRoot: 'html/shot-001', output: {kind: 'mp4', path: 'renders/demo-topic/shots/shot-001.mp4', width: 1920, height: 1080, fps: 30}, composition: 'asset', visualMode: 'html', files: ['html/shot-001/index.html']},
    qualityChecks: {lint: true, validate: true, inspect: true, animationMap: true, strict: true}, assets: [],
  }, null, 2), 'utf8');

  const authored = collectEpisodeStatus('demo-topic', root);
  assert.equal(authored.checks.find((check) => check.id === 'planning-approved')?.ok, true);
  assert.equal(authored.checks.find((check) => check.id === 'script')?.ok, true);
  assert.equal(authored.checks.find((check) => check.id === 'shot-sources')?.ok, true);
  assert.equal(authored.checks.find((check) => check.id === 'shot-renders')?.ok, false);
  assert.equal(authored.nextAction, 'npm run render-episode-shots -- demo-topic');
  assert.equal(authored.notes.some((note) => note.includes('validate-episode-shots')), true);

  console.log('episode status reports pipeline checkpoints and the next command');
} finally {
  rmSync(root, {recursive: true, force: true});
}