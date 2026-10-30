import {existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {z} from 'zod';

export const planningStateSchema = z.enum([
  'discussion',
  'content-approved',
  'storyboard-approved',
  'shot-design-approved',
  'source-authoring',
  'renderer-validation',
  'final-render',
]);

export const planningApprovalsSchema = z.object({
  content: z.boolean(),
  storyboard: z.boolean(),
  shotDesign: z.boolean(),
});

export const planningFrontMatterSchema = z.object({
  state: planningStateSchema,
  approvals: planningApprovalsSchema,
}).strict();

export type PlanningState = z.infer<typeof planningStateSchema>;
export type PlanningApprovals = z.infer<typeof planningApprovalsSchema>;

const approvedStates = new Set<PlanningState>([
  'shot-design-approved',
  'source-authoring',
  'renderer-validation',
  'final-render',
]);

/** States that may be written by `npm run approve-episode`. */
export const approvedPlanningStates = [
  'shot-design-approved',
  'source-authoring',
  'renderer-validation',
  'final-render',
] as const satisfies readonly PlanningState[];

export function isApprovedPlanningState(state: PlanningState): boolean {
  return approvedStates.has(state);
}

/**
 * Split a plan document into its YAML front matter block and the Markdown body.
 * Kept deliberately small: the front matter contract is a flat `state` +
 * `approvals` block, not general YAML.
 */
export function splitPlanningFrontMatter(text: string, path: string): {frontMatter: string; body: string} {
  if (!text.startsWith('---')) throw new Error(`${path}: missing YAML front matter`);
  const end = text.indexOf('\n---', 3);
  if (end < 0) throw new Error(`${path}: unterminated YAML front matter`);
  const frontMatter = text.slice(3, end);
  const body = text.slice(end + 4).replace(/^(?:\r?\n)+/, '');
  return {frontMatter, body};
}

export function renderPlanningFrontMatter(
  state: PlanningState,
  approvals: PlanningApprovals,
  eol = '\n',
): string {
  return [
    '---',
    `state: ${state}`,
    'approvals:',
    `  content: ${approvals.content}`,
    `  storyboard: ${approvals.storyboard}`,
    `  shot-design: ${approvals.shotDesign}`,
    '---',
  ].join(eol);
}

/**
 * Replace a plan document's front matter with explicit approval values while
 * preserving the authored Markdown body (and the file's original line ending).
 */
export function applyPlanningApproval(
  text: string,
  path: string,
  state: PlanningState,
  approvals: PlanningApprovals,
): string {
  const {body} = splitPlanningFrontMatter(text, path);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const frontMatter = renderPlanningFrontMatter(state, approvals, eol);
  return body ? `${frontMatter}${eol}${eol}${body}` : `${frontMatter}${eol}`;
}

function parseFrontMatter(text: string, path: string): unknown {
  const {frontMatter} = splitPlanningFrontMatter(text, path);
  const lines = frontMatter.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const values: Record<string, unknown> = {};
  let inApprovalFields = false;
  for (const line of lines) {
    if (line === 'approvals:') { inApprovalFields = true; continue; }
    if (inApprovalFields && /^(content|storyboard|shot-design):/.test(line)) continue;
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === 'approvals') continue;
    values[key] = value;
  }
  const approvals: Record<string, boolean> = {};
  let inApprovals = false;
  for (const line of lines) {
    if (line === 'approvals:') { inApprovals = true; continue; }
    if (inApprovals) {
      const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(true|false)$/);
      if (match) approvals[match[1] === 'shot-design' ? 'shotDesign' : match[1]] = match[2] === 'true';
    }
  }
  values.approvals = approvals;
  return planningFrontMatterSchema.parse(values);
}

export type PlanningDocument = {
  path: string;
  text: string;
  characters: number;
  frontMatter: z.infer<typeof planningFrontMatterSchema>;
};

export function loadPlanningDocuments(episodeId: string, projectRoot = process.cwd()): {contentPlan: PlanningDocument; shotDesign: PlanningDocument} {
  const root = resolve(projectRoot, 'content', 'episodes', episodeId);
  const read = (name: string): PlanningDocument => {
    const path = join(root, name);
    if (!existsSync(path)) throw new Error(`${episodeId}: missing ${name}`);
    const text = readFileSync(path, 'utf8');
    if (text.trim().length === 0) throw new Error(`${episodeId}: ${name} is empty`);
    return {path, text, characters: text.length, frontMatter: parseFrontMatter(text, `${episodeId}/${name}`) as PlanningDocument['frontMatter']};
  };
  return {contentPlan: read('content-plan.md'), shotDesign: read('shot-design.md')};
}

export function validatePlanning(episodeId: string, projectRoot = process.cwd()): {contentPlan: PlanningDocument; shotDesign: PlanningDocument} {
  const documents = loadPlanningDocuments(episodeId, projectRoot);
  for (const [label, document] of [
    ['content-plan.md', documents.contentPlan],
    ['shot-design.md', documents.shotDesign],
  ] as const) {
    const paragraphs = document.text.split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);
    const counts = new Map<string, number>();
    for (const paragraph of paragraphs) counts.set(paragraph, (counts.get(paragraph) ?? 0) + 1);
    const repeated = [...counts.entries()].find(([, count]) => count >= 3);
    if (repeated) throw new Error(`${episodeId}: ${label} contains repeated paragraph content (${repeated[1]} copies); planning length must come from distinct material`);
    if (!isApprovedPlanningState(document.frontMatter.state)) throw new Error(`${episodeId}: ${label} state must be shot-design-approved or later (got ${document.frontMatter.state})`);
    if (!document.frontMatter.approvals.content || !document.frontMatter.approvals.storyboard || !document.frontMatter.approvals.shotDesign) {
      throw new Error(`${episodeId}: ${label} requires content, storyboard, and shot-design approvals`);
    }
  }
  return documents;
}
