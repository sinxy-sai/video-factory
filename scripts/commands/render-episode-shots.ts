import {existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {loadShotBriefs} from '../lib/episode-workflow-validation';
import {ensureRenderDir, loadEpisodeManifest, shotOutputPath, shotSourceDirectory} from '../lib/episode-runtime';
import {getRendererAdapter, validateRenderer} from '../../production/renderers';
import {validatePlanning} from '../../production/planning';
import {selectShotBriefs} from '../lib/shot-selection';
import type {ShotBrief} from '../../content/shot-brief';

const args = process.argv.slice(2);
const [episodeId] = args;
if (!episodeId) { console.error('Usage: npm run render-episode-shots -- <episode-id> [--shot <shot-id>]'); process.exit(1); }
const manifest = await loadEpisodeManifest(episodeId);
validatePlanning(episodeId);
let briefs: ShotBrief[];
try {
  briefs = selectShotBriefs(loadShotBriefs(episodeId), args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const outputRoot = join(ensureRenderDir(manifest), 'shots');
mkdirSync(outputRoot, {recursive: true});
let failed = false;
for (const brief of briefs) {
  const directory = shotSourceDirectory(episodeId, brief);
  const output = shotOutputPath(episodeId, brief);
  try { validateRenderer({episodeId, brief, directory, output}); } catch (error) { failed = true; console.error(error instanceof Error ? error.message : error); continue; }
  const status = getRendererAdapter(brief.renderer).run('render', {episodeId, brief, directory, output});
  if (status !== 0 || !existsSync(output)) { failed = true; console.error(`${episodeId}/${brief.id}: ${brief.renderer} render failed`); }
}
if (failed) process.exit(1);
console.log(`Rendered ${briefs.length} shot asset(s) to ${outputRoot}`);