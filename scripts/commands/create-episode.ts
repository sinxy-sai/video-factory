import {spawnSync} from 'node:child_process';
import {createEpisodeScaffold, type EpisodeScaffold} from '../lib/episode-scaffold';

const [episodeId] = process.argv.slice(2);

if (!episodeId) {
  console.error('Usage: npm run create-episode -- <episode-id>');
  process.exit(1);
}

let scaffold: EpisodeScaffold;
try {
  scaffold = createEpisodeScaffold(episodeId);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const result = spawnSync('npm', ['run', 'generate-episode-registry'], {stdio: 'inherit', shell: true});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Created episode scaffold: ${scaffold.directory}`);
console.log(`Next commands:`);
console.log(`  npm run episode-status -- ${scaffold.safeId}`);
console.log(`  npm run approve-episode -- ${scaffold.safeId}`);
console.log(`  npm run validate-episode -- ${scaffold.safeId}`);
console.log(`  npm run validate-episode-shots -- ${scaffold.safeId}`);
console.log(`  npm run preview-episode -- ${scaffold.safeId}`);
console.log(`  npm run render-episode -- ${scaffold.safeId}`);