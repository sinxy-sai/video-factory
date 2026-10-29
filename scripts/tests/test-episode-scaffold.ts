import assert from 'node:assert/strict';
import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createEpisodeScaffold} from '../lib/episode-scaffold';
import {shotBriefSchema} from '../../content/shot-brief';

const root = mkdtempSync(join(tmpdir(), 'science-video-scaffold-'));
try {
  const scaffold = createEpisodeScaffold('demo-topic', {
    projectRoot: root,
    gsapSource: resolve('node_modules', 'gsap', 'dist', 'gsap.min.js'),
  });
  const episodeRoot = join(root, 'content', 'episodes', 'demo-topic');
  assert.equal(scaffold.directory, join('content', 'episodes', 'demo-topic'));

  for (const file of ['content-plan.md', 'shot-design.md', 'script.md', 'storyboard.md', 'visual-style.md', 'manifest.ts', 'episode.ts', 'shot-briefs/shot-001.json', 'html/shot-001/index.html', 'html/shot-001/assets/gsap.min.js']) {
    assert.equal(existsSync(join(episodeRoot, file)), true, `scaffold must include ${file}`);
  }

  const html = readFileSync(join(episodeRoot, 'html', 'shot-001', 'index.html'), 'utf8');
  assert.equal(html.includes('class="rule clip"'), true, 'timed scaffold element needs class="clip" for hyperframes check --strict');
  const timedTags = html.match(/<[^>]*data-start="[^"]*"[^>]*>/g) ?? [];
  assert.ok(timedTags.length > 0, 'scaffold shot should keep at least one timed element');
  for (const tag of timedTags) assert.match(tag, /class="[^"]*\bclip\b/, `timed element must carry class="clip": ${tag}`);
  assert.equal(html.includes('data-composition-id="shot-001"'), true);

  const manifestSource = readFileSync(join(episodeRoot, 'manifest.ts'), 'utf8');
  assert.match(manifestSource, /captionMode: 'required'/, 'scaffold manifest must declare the default caption mode');
  assert.match(manifestSource, /id: 'demo-topic'/);

  const brief = shotBriefSchema.parse(JSON.parse(readFileSync(join(episodeRoot, 'shot-briefs', 'shot-001.json'), 'utf8')));
  assert.equal(brief.durationInFrames, 150);
  if (brief.implementation.composition !== 'asset') throw new Error('scaffold shot brief must use a single-layer asset implementation');
  assert.equal(brief.implementation.sourceRoot, 'html/shot-001');

  assert.throws(
    () => createEpisodeScaffold('demo-topic', {projectRoot: root, gsapSource: resolve('node_modules', 'gsap', 'dist', 'gsap.min.js')}),
    /Episode already exists/,
  );
  assert.throws(() => createEpisodeScaffold('../outside', {projectRoot: root}), /Invalid episode id/);

  console.log('episode scaffold generates a strict-clean default shot and default caption mode');
} finally {
  rmSync(root, {recursive: true, force: true});
}