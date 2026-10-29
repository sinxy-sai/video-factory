import assert from 'node:assert/strict';
import {parseShotFlag, resolveShotBriefs, selectShotBriefs} from '../lib/shot-selection';
import type {ShotBrief} from '../../content/shot-brief';

const brief = (id: string, sceneId: string): ShotBrief => ({
  id,
  sceneId,
  title: `${id} title`,
  narration: `${id} narration`,
  visual: 'intro',
  renderer: 'browser',
  visualStyle: 'episode-defined',
  visualDirection: {composition: 'diagram', focalPoint: 'bar', hierarchy: ['bar'], palette: 'dark', typography: 'sans'},
  motion: {entrance: 'rise', transformation: 'grow', exit: 'transition-owned', transition: 'cut', pacing: 'measured'},
  durationInFrames: 150,
  continuity: {leaves: [], inherits: []},
  implementation: {sourceRoot: 'html/shot-001', output: {kind: 'mp4', path: 'renders/demo/shots/shot-001.mp4', width: 1920, height: 1080, fps: 30}, composition: 'asset', visualMode: 'html', files: ['html/shot-001/index.html']},
  qualityChecks: {lint: true, validate: true, inspect: true, animationMap: true, strict: true},
  assets: [],
});

const briefs = [brief('shot-001', 'intro'), brief('shot-002', 'process')];

assert.deepEqual(selectShotBriefs(briefs, []).map((item) => item.id), ['shot-001', 'shot-002']);
assert.deepEqual(selectShotBriefs(briefs, ['--shot', 'shot-002']).map((item) => item.id), ['shot-002']);
assert.deepEqual(selectShotBriefs(briefs, ['--strict']).map((item) => item.id), ['shot-001', 'shot-002'], 'unrelated flags are ignored');
assert.equal(parseShotFlag([]), null);
assert.equal(parseShotFlag(['--shot', 'shot-001']), 'shot-001');
assert.deepEqual(resolveShotBriefs(briefs, 'shot-001').map((item) => item.id), ['shot-001']);

assert.throws(() => parseShotFlag(['--shot']), /requires a shot id/);
assert.throws(() => parseShotFlag(['--shot', '--strict']), /requires a shot id/);
assert.throws(() => parseShotFlag(['--shot', 'shot-001', '--shot', 'shot-002']), /exactly one/);
assert.throws(() => selectShotBriefs(briefs, ['--shot', 'shot-999']), /Unknown shot "shot-999".*shot-001, shot-002/);

console.log('shot selection filters single shots for render, preview, and validation');