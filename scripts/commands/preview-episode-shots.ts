import {loadShotBriefs} from '../lib/episode-workflow-validation';
import {shotSourceDirectory} from '../lib/episode-runtime';
import {getRendererAdapter, validateRenderer} from '../../production/renderers';
import {validatePlanning} from '../../production/planning';
import {parseShotFlag, resolveShotBriefs} from '../lib/shot-selection';
import type {ShotBrief} from '../../content/shot-brief';

const args = process.argv.slice(2);
const [episodeId, positionalShot] = args;
if (!episodeId) { console.error('Usage: npm run preview-episode-shots -- <episode-id> [shot-id | --shot <shot-id>]'); process.exit(1); }
validatePlanning(episodeId);
const positional = positionalShot && !positionalShot.startsWith('--') ? positionalShot : null;
let requested: string | null;
try {
  const flagShot = parseShotFlag(args);
  if (positional && flagShot && positional !== flagShot) throw new Error('Provide the shot id either positionally or with --shot, not both');
  requested = flagShot ?? positional;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const briefs = loadShotBriefs(episodeId);
let brief: ShotBrief;
try {
  brief = requested ? resolveShotBriefs(briefs, requested)[0] : briefs[0];
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const directory = shotSourceDirectory(episodeId, brief);
validateRenderer({episodeId, brief, directory});
process.exit(getRendererAdapter(brief.renderer).run('preview', {episodeId, brief, directory}));