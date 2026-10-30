import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {isApprovedPlanningState} from '../../production/planning';
import {implementationFiles} from '../../production/shot-contract';
import type {ShotBrief} from '../../content/shot-brief';
import {inspectPlanningForApproval} from './episode-approval';
import {assertEpisodeId} from './episode-id';
import {loadShotBriefs} from './episode-workflow-validation';
import {containsPlaceholder} from './placeholder-terms';

export type EpisodeStatusGroup = 'planning' | 'storyboard' | 'shots' | 'assets' | 'renders' | 'output';

export type EpisodeStatusCheck = {
  id: string;
  group: EpisodeStatusGroup;
  label: string;
  ok: boolean;
  detail: string;
};

export type EpisodeStatus = {
  episodeId: string;
  exists: boolean;
  checks: EpisodeStatusCheck[];
  nextAction: string;
  notes: string[];
};

const authoredCheck = (id: string, group: EpisodeStatusGroup, label: string, path: string): EpisodeStatusCheck => {
  if (!existsSync(path)) return {id, group, label, ok: false, detail: 'missing'};
  const text = readFileSync(path, 'utf8');
  if (text.trim().length === 0) return {id, group, label, ok: false, detail: 'empty'};
  if (containsPlaceholder(text)) return {id, group, label, ok: false, detail: 'contains placeholder text'};
  return {id, group, label, ok: true, detail: `${text.trim().length} characters`};
};

const shotOutputExtension = (brief: ShotBrief): string =>
  brief.implementation.output.kind === 'frame-sequence' ? 'frames' : brief.implementation.output.kind;

/**
 * Read the on-disk pipeline state for one episode. This is intentionally
 * filesystem-only (no registry or renderer invocation) so an AI can ask for
 * progress even while an episode module is still mid-edit.
 */
export function collectEpisodeStatus(episodeId: string, projectRoot = process.cwd()): EpisodeStatus {
  const safeId = assertEpisodeId(episodeId);
  const root = resolve(projectRoot, 'content', 'episodes', safeId);
  if (!existsSync(root)) {
    return {
      episodeId: safeId,
      exists: false,
      checks: [{id: 'episode-directory', group: 'planning', label: 'episode directory', ok: false, detail: 'missing'}],
      nextAction: `npm run create-episode -- ${safeId}`,
      notes: [],
    };
  }

  const checks: EpisodeStatusCheck[] = [
    {id: 'episode-directory', group: 'planning', label: 'episode directory', ok: true, detail: join('content', 'episodes', safeId)},
  ];

  const inspection = inspectPlanningForApproval(safeId, projectRoot);
  checks.push({
    id: 'planning-docs',
    group: 'planning',
    label: 'content-plan.md + shot-design.md authored',
    ok: inspection.loaded && inspection.issues.length === 0,
    detail: inspection.issues.length > 0 ? inspection.issues.join('; ') : 'placeholder-free and above the minimum size',
  });
  const approved = inspection.loaded && inspection.documents.length > 0 && inspection.documents.every((document) =>
    isApprovedPlanningState(document.state)
    && document.approvals.content
    && document.approvals.storyboard
    && document.approvals.shotDesign);
  checks.push({
    id: 'planning-approved',
    group: 'planning',
    label: 'planning approved in front matter',
    ok: approved,
    detail: approved
      ? 'state >= shot-design-approved and all approvals true'
      : inspection.documents.map((document) => `${document.file}: ${document.state}`).join('; ') || 'front matter unavailable',
  });

  checks.push(authoredCheck('script', 'storyboard', 'script.md', join(root, 'script.md')));
  checks.push(authoredCheck('storyboard-doc', 'storyboard', 'storyboard.md', join(root, 'storyboard.md')));
  checks.push(authoredCheck('visual-style', 'storyboard', 'visual-style.md', join(root, 'visual-style.md')));

  let briefs: ShotBrief[] = [];
  let briefsError: string | null = null;
  try {
    briefs = loadShotBriefs(safeId, projectRoot);
  } catch (error) {
    briefsError = error instanceof Error ? error.message : String(error);
  }
  checks.push({
    id: 'shot-briefs',
    group: 'storyboard',
    label: 'shot briefs',
    ok: briefsError === null && briefs.length > 0,
    detail: briefsError ?? `${briefs.length} brief(s): ${briefs.map((brief) => brief.id).join(', ')}`,
  });

  const missingSources = briefs.flatMap((brief) =>
    implementationFiles(brief.implementation)
      .filter((file) => !existsSync(join(root, file)))
      .map((file) => `${brief.id}:${file}`));
  checks.push({
    id: 'shot-sources',
    group: 'shots',
    label: 'shot source files',
    ok: briefs.length > 0 && missingSources.length === 0,
    detail: briefs.length === 0
      ? 'waiting for shot briefs'
      : missingSources.length > 0 ? `missing ${missingSources.join('; ')}` : `${briefs.length} shot(s) with declared sources`,
  });

  const missingRenders = briefs
    .filter((brief) => !existsSync(join(projectRoot, 'renders', safeId, 'shots', `${brief.id}.${shotOutputExtension(brief)}`)))
    .map((brief) => `${brief.id}.${shotOutputExtension(brief)}`);
  checks.push({
    id: 'shot-renders',
    group: 'renders',
    label: 'rendered shot assets',
    ok: briefs.length > 0 && missingRenders.length === 0,
    detail: briefs.length === 0
      ? 'waiting for shot briefs'
      : missingRenders.length > 0 ? `missing ${missingRenders.join(', ')}` : `${briefs.length} shot output(s) in renders/${safeId}/shots/`,
  });

  const assetsManifest = join(projectRoot, 'static', 'episodes', safeId, 'shots', 'assets.manifest.json');
  checks.push({
    id: 'prepared-assets',
    group: 'assets',
    label: 'prepared static assets',
    ok: existsSync(assetsManifest),
    detail: existsSync(assetsManifest) ? `static/episodes/${safeId}/shots/assets.manifest.json` : 'missing; run prepare-episode-assets',
  });

  const finalVideo = join(projectRoot, 'renders', safeId, 'final.mp4');
  const finalManifest = join(projectRoot, 'renders', safeId, 'final.manifest.json');
  checks.push({
    id: 'final-render',
    group: 'renders',
    label: 'final.mp4',
    ok: existsSync(finalVideo),
    detail: existsSync(finalVideo) ? `renders/${safeId}/final.mp4` : `missing renders/${safeId}/final.mp4`,
  });
  checks.push({
    id: 'final-manifest',
    group: 'renders',
    label: 'final.manifest.json',
    ok: existsSync(finalManifest),
    detail: existsSync(finalManifest) ? `renders/${safeId}/final.manifest.json` : 'missing; written by render-episode',
  });

  const verification = join(projectRoot, 'renders', safeId, 'output-verification.json');
  checks.push({
    id: 'output-verification',
    group: 'output',
    label: 'output-verification.json',
    ok: existsSync(verification),
    detail: existsSync(verification) ? `renders/${safeId}/output-verification.json` : 'missing; run verify-episode-output',
  });

  const notes: string[] = [];
  const shotSourcesOk = checks.find((check) => check.id === 'shot-sources')?.ok === true;
  const preparedAssetsOk = checks.find((check) => check.id === 'prepared-assets')?.ok === true;
  if (shotSourcesOk && missingRenders.length > 0) notes.push(`Before rendering shots, run: npm run validate-episode-shots -- ${safeId}`);
  if (preparedAssetsOk && !existsSync(finalVideo)) notes.push(`Before the final render, run: npm run validate-episode -- ${safeId}`);

  const status: EpisodeStatus = {episodeId: safeId, exists: true, checks, nextAction: '', notes};
  status.nextAction = nextEpisodeAction(status);
  return status;
}

/**
 * Pick the single next command for an AI-driven pipeline. Manual authoring
 * stages name the files to write and the command that follows them.
 */
export function nextEpisodeAction(status: EpisodeStatus): string {
  const byId = new Map(status.checks.map((check) => [check.id, check]));
  const failed = (id: string) => byId.get(id)?.ok === false;
  const id = status.episodeId;
  if (!status.exists) return `npm run create-episode -- ${id}`;
  if (failed('planning-docs')) return `Author content-plan.md and shot-design.md, then run: npm run approve-episode -- ${id}`;
  if (failed('planning-approved')) return `npm run approve-episode -- ${id}`;
  if (failed('script') || failed('storyboard-doc') || failed('visual-style')) return `Author script.md, storyboard.md, and visual-style.md, then run: npm run author-episode-shots -- ${id}`;
  if (failed('shot-briefs')) return `Write shot-briefs/shot-*.json for every manifest scene, then run: npm run validate-episode-shots -- ${id}`;
  if (failed('shot-sources')) return `Implement the declared shot sources in html/ or manim/, then run: npm run validate-episode-shots -- ${id}`;
  if (failed('shot-renders')) return `npm run render-episode-shots -- ${id}`;
  if (failed('prepared-assets')) return `npm run prepare-episode-assets -- ${id}`;
  if (failed('final-render') || failed('final-manifest')) return `npm run render-episode -- ${id}`;
  if (failed('output-verification')) return `npm run verify-episode-output -- ${id}`;
  return `All pipeline stages complete. Optional next: npm run compare-episode-visual-regression -- ${id}`;
}