import {approveEpisodePlanning} from '../lib/episode-approval';

const usage = 'Usage: npm run approve-episode -- <episode-id> [--state shot-design-approved]';
const args = process.argv.slice(2);
const [episodeId] = args;

if (!episodeId) {
  console.error(usage);
  process.exit(1);
}

let state: string | undefined;
for (let index = 1; index < args.length; index += 1) {
  const arg = args[index];
  if (arg !== '--state') {
    console.error(`Unknown argument: ${arg}`);
    console.error(usage);
    process.exit(1);
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error('--state requires a planning state, for example: shot-design-approved');
    console.error(usage);
    process.exit(1);
  }
  state = value;
  index += 1;
}

try {
  const result = approveEpisodePlanning(episodeId, {state});
  console.log(`${result.changed ? 'Approved planning' : 'Planning already approved'}: ${result.episodeId} (state: ${result.state}, approvals: content/storyboard/shot-design = true)`);
  for (const document of result.documents) {
    console.log(`  ${document.file}: ${document.characters} body characters`);
  }
  console.log('Next commands:');
  console.log(`  npm run validate-episode-planning -- ${result.episodeId}`);
  console.log(`  npm run author-episode-shots -- ${result.episodeId}`);
  console.log(`  npm run episode-status -- ${result.episodeId}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}