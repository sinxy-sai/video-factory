import {collectEpisodeStatus, type EpisodeStatus, type EpisodeStatusGroup} from '../lib/episode-status';

const usage = 'Usage: npm run episode-status -- <episode-id>';
const [episodeId] = process.argv.slice(2);
if (!episodeId) {
  console.error(usage);
  process.exit(1);
}

let status: EpisodeStatus;
try {
  status = collectEpisodeStatus(episodeId);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(`Episode status: ${status.episodeId}`);
const groups: EpisodeStatusGroup[] = ['planning', 'storyboard', 'shots', 'assets', 'renders', 'output'];
for (const group of groups) {
  const checks = status.checks.filter((check) => check.group === group);
  if (checks.length === 0) continue;
  console.log(`\n${group.toUpperCase()}`);
  for (const check of checks) {
    console.log(`  [${check.ok ? 'x' : ' '}] ${check.label} — ${check.detail}`);
  }
}
if (status.notes.length > 0) {
  console.log('\nNOTES');
  for (const note of status.notes) console.log(`  - ${note}`);
}
console.log(`\nNext command: ${status.nextAction}`);

if (!status.exists) process.exit(1);