import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadEpisodeManifest, shotSourceDirectory} from '../lib/episode-runtime';
import {loadShotBriefs} from '../lib/episode-workflow-validation';
import {getRendererAdapter, validateRenderer} from '../../production/renderers';
import {selectShotBriefs} from '../lib/shot-selection';
import type {ShotBrief} from '../../content/shot-brief';

const args = process.argv.slice(2);
const [episodeId] = args;
if (!episodeId) {
  console.error('Usage: npm run validate-episode-shots -- <episode-id> [--shot <shot-id>]');
  process.exit(1);
}

await loadEpisodeManifest(episodeId);
const allBriefs = loadShotBriefs(episodeId);
let briefs: ShotBrief[];
try {
  briefs = selectShotBriefs(allBriefs, args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
let failed = false;
const animationMap = resolve(process.env.CODEX_HOME ?? '', 'plugins', 'cache', 'openai-api-curated', 'hyperframes', 'd416fd5a', 'skills', 'hyperframes', 'scripts', 'animation-map.mjs');

for (const brief of briefs) {
  const directory = shotSourceDirectory(episodeId, brief);
  try {
    validateRenderer({episodeId, brief, directory});
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    failed = true;
    continue;
  }
  const adapter = getRendererAdapter(brief.renderer);
  const status = adapter.run('validate', {episodeId, brief, directory});
  if (status !== 0) { failed = true; console.error(`${episodeId}/${brief.id}: ${brief.renderer} validation failed`); }
  if (brief.renderer === 'browser' && brief.qualityChecks.animationMap && existsSync(animationMap)) {
    const mapResult = spawnSync(process.execPath, [animationMap, directory], {cwd: directory, stdio: 'inherit'});
    if (mapResult.status !== 0) { failed = true; console.error(`${episodeId}/${brief.id}: animation map failed`); }
  }
}

if (failed) process.exit(1);
console.log(`Shot quality checks passed: ${episodeId}${briefs.length < allBriefs.length ? ` (${briefs.map((brief) => brief.id).join(', ')})` : ''}`);